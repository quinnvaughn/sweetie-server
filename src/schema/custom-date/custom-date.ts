import * as Sentry from "@sentry/node"
import { DateTime, Interval } from "luxon"
import { z } from "zod"
import { builder } from "../../builder"
import {
	calculateCustomDatePrice,
	calculateCustomDatePriceWithoutStripeFee,
} from "../../lib"
import {
	dateRequestForTastemaker,
	tellDateRequestorWeGotTheirCustomDateRequest,
	timeToMs,
	track,
	updateDateRequestor,
} from "../../lib"
import { omit } from "../../lib/object"
import { emailQueue } from "../../lib/queue"
import {
	customDateQueue,
	removeCheckAcceptance,
} from "../../lib/queue/custom-date"
import { AuthError, FieldError, FieldErrors } from "../error"
import {
	AcceptedCustomDateEvent,
	DeclinedCustomDateEvent,
	ExpiredCustomDateEvent,
	NewCustomDateEvent,
	publishCustomDateEvent,
} from "../subscription/custom-date"

builder.objectType("CustomDate", {
	fields: (t) => ({
		id: t.exposeID("id"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		cost: t.exposeInt("cost"),
		suggestions: t.field({
			type: ["CustomDateSuggestion"],
			resolve: (p, _a, { prisma }) =>
				prisma.customDateSuggestion.findMany({
					where: {
						customDateId: p.id,
					},
				}),
		}),
		mostRecentSuggestion: t.field({
			type: "CustomDateSuggestion",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				const suggestion = await prisma.customDateSuggestion.findFirst({
					where: {
						customDateId: p.id,
					},
					orderBy: {
						revisionNumber: "desc",
					},
				})
				if (!suggestion) {
					return null
				}
				return suggestion
			},
		}),
		lastMessageSentAt: t.field({
			type: "DateTime",
			resolve: (p) =>
				p.lastMessageSentAt ? new Date(p.lastMessageSentAt) : p.createdAt,
		}),
		changesCanBeRequested: t.boolean({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// changes can be requested when the status is suggested
				// and there is only one suggestion
				// and the user is the requestor.

				if (currentUser?.id !== p.requestorId) {
					return false
				}

				const suggestions = await prisma.customDateSuggestion.findMany({
					where: {
						customDateId: p.id,
					},
					include: {
						status: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						revisionNumber: "desc",
					},
				})

				const mostRecentSuggestion = suggestions[0]

				if (!mostRecentSuggestion) {
					return false
				}

				if (
					mostRecentSuggestion.status.name === "suggested" &&
					suggestions.length < 2
				) {
					return true
				}
				return false
			},
		}),
		canBeAccepted: t.boolean({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// can be accepted when:
				// - the user is the requestor
				// - the suggestion status is not accepted

				if (currentUser?.id !== p.requestorId) {
					return false
				}

				const customDateStatus =
					await prisma.customDateSuggestionStatus.findFirst({
						where: {
							name: "accepted",
						},
					})

				if (!customDateStatus) {
					return false
				}

				const mostRecentSuggestion =
					await prisma.customDateSuggestion.findFirst({
						where: {
							customDateId: p.id,
						},
						orderBy: {
							revisionNumber: "desc",
						},
					})

				if (!mostRecentSuggestion) {
					return false
				}

				if (mostRecentSuggestion.statusId === customDateStatus.id) {
					return false
				}
				return true
			},
		}),
		refundCanBeRequested: t.boolean({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// can be refunded when:
				// - is within 48 hours of being accepted
				// - the suggestion status is not accepted. (accepted is the only status that can't be refunded)
				// - the user is the requestor

				if (currentUser?.id !== p.requestorId) {
					return false
				}
				const customDateStatus = await prisma.customDateStatus.findFirst({
					where: {
						name: "accepted",
					},
				})
				if (!customDateStatus) {
					return false
				}
				// cannot refund a not accepted date
				if (p.statusId !== customDateStatus.id) {
					return false
				}
				if (!p.respondedAt) {
					return false
				}
				const diff = Interval.fromDateTimes(
					p.respondedAt,
					DateTime.now(),
				).length("hours")

				// if it's been more than 48 hours, it can't be refunded
				if (diff >= 48) {
					return false
				}

				const mostRecentSuggestion =
					await prisma.customDateSuggestion.findFirst({
						where: {
							customDateId: p.id,
						},
						orderBy: {
							revisionNumber: "desc",
						},
					})
				// if there are no suggestions, it can be refunded
				if (!mostRecentSuggestion) {
					return true
				}

				// if the most recent suggestion is not accepted, it can be refunded
				if (mostRecentSuggestion.statusId !== customDateStatus.id) {
					return true
				}
				return false
			},
		}),
		suggestionCanBeRevised: t.boolean({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// can be revised when:
				// - there are no suggestions
				// - the previous suggestion changes were requested and there is only one suggestion
				// and the user is the tastemaker.
				const tastemaker = await prisma.tastemaker.findFirst({
					where: {
						id: p.tastemakerId,
					},
					include: {
						user: {
							select: {
								id: true,
							},
						},
					},
				})

				if (!tastemaker) {
					return false
				}

				if (currentUser?.id !== tastemaker.user.id) {
					return false
				}

				const suggestions = await prisma.customDateSuggestion.findMany({
					where: {
						customDateId: p.id,
					},
					include: {
						status: {
							select: {
								name: true,
							},
						},
					},
					orderBy: {
						revisionNumber: "desc",
					},
				})

				const mostRecentSuggestion = suggestions[0]

				if (!mostRecentSuggestion) {
					return true
				}
				if (
					mostRecentSuggestion.status.name === "changes requested" &&
					suggestions.length < 2
				) {
					return true
				}
				return false
			},
		}),
		isUserRequestor: t.field({
			type: "Boolean",
			resolve: (p, _a, { currentUser }) => {
				return currentUser?.id === p.requestorId
			},
		}),
		isUserTastemaker: t.field({
			type: "Boolean",
			resolve: async (p, _a, { currentUser, prisma }) => {
				const tastemaker = await prisma.tastemaker.findFirst({
					where: {
						id: p.tastemakerId,
						userId: currentUser?.id,
					},
				})
				return !!tastemaker
			},
		}),
		messagePreview: t.string({
			resolve: async (p, _a, { prisma }) => {
				const message = await prisma.customDateMessage.findFirst({
					where: {
						customDateId: p.id,
					},
					orderBy: {
						createdAt: "desc",
					},
				})
				if (!message) {
					return "No messages sent yet."
				}
				return message.text
			},
		}),
		title: t.string({
			resolve: async (p, _a, { prisma, currentUser }) => {
				const user = await prisma.user.findUniqueOrThrow({
					where: {
						id: p.requestorId,
					},
				})
				const tastemaker = await prisma.tastemaker.findUniqueOrThrow({
					where: {
						id: p.tastemakerId,
					},
					include: {
						user: {
							select: {
								name: true,
							},
						},
					},
				})
				if (currentUser?.id === user.id) {
					return tastemaker.user.name
				}
				return user.name
			},
		}),
		payout: t.string({
			// 20% of the cost as our fee
			resolve: async (p, _a, { prisma, currentUser }) => {
				const tastemaker = await prisma.tastemaker.findUniqueOrThrow({
					where: {
						id: p.tastemakerId,
					},
				})
				if (currentUser?.id === tastemaker.userId) {
					return `$${
						calculateCustomDatePriceWithoutStripeFee(
							tastemaker.price,
							p.numStops,
						) * 0.8
					}`
				}
				return "Hidden"
			},
		}),
		formattedCost: t.string({
			resolve: (p) => {
				const cost = p.cost / 100
				return `$${cost.toFixed(2)}`
			},
		}),
		cities: t.field({
			type: ["City"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.city.findMany({
					where: {
						customDates: {
							some: {
								id: parent.id,
							},
						},
					},
				})
			},
		}),
		tags: t.field({
			type: ["Tag"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.tag.findMany({
					where: {
						customDates: {
							some: {
								id: parent.id,
							},
						},
					},
				})
			},
		}),
		tastemaker: t.field({
			type: "Tastemaker",
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.tastemaker.findUniqueOrThrow({
					where: {
						id: parent.tastemakerId,
					},
				})
			},
		}),
		requestor: t.field({
			type: "User",
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.user.findUniqueOrThrow({
					where: {
						id: parent.requestorId,
					},
				})
			},
		}),
		beginsAt: t.expose("beginsAt", { type: "DateTime" }),
		numStops: t.exposeInt("numStops"),
		priceRangeMin: t.exposeInt("priceRangeMin", { nullable: true }),
		priceRangeMax: t.exposeInt("priceRangeMax", { nullable: true }),
		status: t.field({
			type: "CustomDateStatus",
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.customDateStatus.findUniqueOrThrow({
					where: {
						id: parent.statusId,
					},
				})
			},
		}),
		notes: t.exposeString("notes", { nullable: true }),
		respondedAt: t.expose("respondedAt", { type: "DateTime", nullable: true }),
		messages: t.field({
			type: ["CustomDateMessage"],
			// Probably eventually want to paginate this
			// But not sure there would be enough messages at first
			// for this to be an issue.
			resolve: (p, _, { prisma }) =>
				prisma.customDateMessage.findMany({
					where: {
						customDateId: p.id,
					},
					orderBy: {
						// eventually should be desc and we reverse them
						// in the client and paginate.
						createdAt: "desc",
					},
				}),
		}),
	}),
})

builder.objectType("CustomDateStatus", {
	fields: (t) => ({
		id: t.exposeID("id"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		name: t.exposeString("name"),
		customDates: t.field({
			type: ["CustomDate"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.customDate.findMany({
					where: {
						statusId: parent.id,
					},
				})
			},
		}),
	}),
})

const RequestCustomDateInput = builder.inputType("RequestCustomDateInput", {
	fields: (t) => ({
		cities: t.field({
			type: ["String"],
		}),
		beginsAt: t.field({
			type: "DateTime",
			required: true,
		}),
		numStops: t.int({ required: true }),
		priceRangeMin: t.int({ required: false }),
		priceRangeMax: t.int({ required: false }),
		notes: t.string({ required: false }),
		tastemakerUsername: t.string({ required: true }),
		tags: t.stringList(),
	}),
})

const requestCustomDateSchema = z
	.object({
		cities: z.array(z.string({ invalid_type_error: "Must be a string" })),
		beginsAt: z.date().refine(
			(d) => {
				// make sure date is 36 hours in the future at least
				const diff = Interval.fromDateTimes(
					DateTime.now(),
					DateTime.fromJSDate(d),
				).length("hours")
				return diff >= 36
			},
			{
				message: "Date must be at least 36 hours in the future",
				path: ["time"],
			},
		),
		tags: z.array(z.string({ invalid_type_error: "Must be a string" })),
		numStops: z.number().min(1, { message: "Must be at least 1 stop" }),
		priceRangeMin: z.object({
			field: z
				.number()
				.min(0, { message: "Must be at least 0" })
				.or(z.literal(null)),
		}),
		priceRangeMax: z.object({
			field: z
				.number()
				.min(0, { message: "Must be at least 0" })
				.or(z.literal(null)),
		}),
		notes: z
			.string()
			.max(500, { message: "Must be no more than 500 characters" })
			.optional(),
		tastemakerUsername: z.string(),
	})
	.refine(
		(data) =>
			data.priceRangeMin.field && data.priceRangeMax.field
				? data.priceRangeMin.field <= data.priceRangeMax.field
				: true,
		{
			message: "Max must be greater than min",
			path: ["priceRangeMax", "field"],
		},
	)

const RespondToCustomDateInput = builder.inputType("RespondToCustomDateInput", {
	fields: (t) => ({
		customDateId: t.string({ required: true }),
		response: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	requestCustomDate: t.field({
		type: "CustomDate",
		errors: {
			types: [Error, AuthError, FieldErrors],
		},
		args: {
			input: t.arg({
				type: RequestCustomDateInput,
				required: true,
			}),
		},
		resolve: async (_p, { input }, { prisma, currentUser, req, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to request a date")
			}
			const user = await prisma.user.findUnique({
				where: {
					username: input.tastemakerUsername,
				},
				include: {
					tastemaker: {
						select: {
							id: true,
							price: true,
							isSetup: true,
						},
					},
				},
			})
			if (!user) {
				throw new Error("User not found")
			}
			// user cannot request a date from themselves
			if (input.tastemakerUsername === currentUser.username) {
				throw new Error("You cannot request a date from yourself")
			}
			const cities = await prisma.city.findMany({
				where: {
					id: {
						in: input.cities ?? [],
					},
				},
			})
			if (cities.length !== input.cities?.length) {
				throw new FieldErrors([
					new FieldError("cities", "One or more cities not found"),
				])
			}
			const tags = await prisma.tag.findMany({
				where: {
					name: {
						in: input.tags ?? [],
					},
				},
			})
			if (tags.length !== input.tags?.length) {
				throw new FieldErrors([
					new FieldError("tags", "One or more tags not found"),
				])
			}
			const result = requestCustomDateSchema.safeParse({
				...omit(input, "priceRangeMax", "priceRangeMin"),
				priceRangeMax: {
					field: input.priceRangeMax ?? null,
				},
				priceRangeMin: {
					field: input.priceRangeMin ?? null,
				},
			})

			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { data } = result
			const status = await prisma.customDateStatus.findUnique({
				where: {
					name: "requested",
				},
			})
			if (!status) {
				throw new Error("Status not found")
			}

			if (!user.tastemaker) {
				throw new Error("User is not a tastemaker")
			}

			if (!user.tastemaker.isSetup) {
				throw new Error("Tastemaker has not setup their profile")
			}

			try {
				const cost = calculateCustomDatePrice(
					user.tastemaker.price,
					input.numStops,
				)
				const customDate = await prisma.customDate.create({
					data: {
						...omit(
							data,
							"tastemakerUsername",
							"priceRangeMax",
							"priceRangeMin",
						),
						priceRangeMax: data.priceRangeMax?.field ?? null,
						priceRangeMin: data.priceRangeMin?.field ?? null,
						tags: {
							connect: tags.map((tag) => ({ id: tag.id })),
						},
						tastemakerId: user.tastemaker.id,
						cost,
						statusId: status.id,
						requestorId: currentUser.id,
						cities: {
							connect: cities.map((city) => ({ id: city.id })),
						},
					},
				})
				await emailQueue.add(
					"email",
					dateRequestForTastemaker({
						email: user.email,
						requestorName: currentUser.name,
					}),
					{ attempts: 3 },
				)
				await emailQueue.add(
					"email",
					tellDateRequestorWeGotTheirCustomDateRequest({
						email: currentUser.email,
						requestorName: currentUser.name,
						creatorName: user.name,
					}),
				)
				await customDateQueue.add(
					"check_acceptance",
					{ customDateId: customDate.id },
					{
						delay: timeToMs("24:00"),
						attempts: 10,
						backoff: {
							type: "exponential",
							delay: 1000,
						},
					},
				)
				await publishCustomDateEvent(new NewCustomDateEvent(customDate), pubsub)

				// TODO: Remove this and put it on the client
				track(req, "Custom date Requested", {
					requested_at: new Date(),
					tastemaker_id: user.id,
					tastemaker_name: user.name,
					tastemaker_username: user.username,
					requestor_name: currentUser.name,
					requestor_username: currentUser.username,
					distinct_id: currentUser.id,
					cities: cities.map((city) => city.name),
					begins_at: customDate.beginsAt,
					num_stops: customDate.numStops,
					price_range_min: customDate.priceRangeMin,
					price_range_max: customDate.priceRangeMax,
					tags: tags.map((tag) => tag.name),
					cost,
				})
				return customDate
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Could not create custom date request")
			}
		},
	}),
	respondToCustomDate: t.field({
		type: "CustomDate",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: RespondToCustomDateInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser, req, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to respond to a date")
			}
			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					tastemaker: {
						select: {
							id: true,
						},
					},
				},
			})
			if (!user) {
				throw new Error("User not found")
			}
			const dateRequest = await prisma.customDate.findUnique({
				where: {
					id: input.customDateId,
					tastemakerId: user.tastemaker?.id,
				},
				include: {
					status: {
						select: {
							name: true,
						},
					},
				},
			})

			if (!dateRequest) {
				throw new Error("Unable to find date request.")
			}
			// This covers accepted, declined, expired and cancelled.
			if (dateRequest.status.name !== "requested") {
				throw new Error("Date request is not requested.")
			}
			const status = await prisma.customDateStatus.findUnique({
				where: {
					name: input.response,
				},
			})

			if (!status) {
				throw new Error("Unable to find status.")
			}

			// check to see if it's been over 24 hours since the request was created
			// if so, expire the request and return error.
			const diff = Interval.fromDateTimes(
				dateRequest.createdAt,
				DateTime.now(),
			).length("days")

			if (diff >= 1) {
				try {
					const customDate = await prisma.customDate.update({
						where: {
							id: input.customDateId,
						},
						data: {
							status: {
								connect: {
									name: "expired",
								},
							},
							completed: true,
							respondedAt: new Date(),
						},
					})
					await publishCustomDateEvent(
						new ExpiredCustomDateEvent(customDate),
						pubsub,
					)
					throw new Error("Date request has expired")
				} catch (e) {
					// we are throwing in a try catch to make sure the
					// update doesn't break, but we actually want to return
					// the error being thrown above.
					if (e.message === "Date request has expired") {
						throw e
					}
					Sentry.setUser({ id: currentUser.id, email: currentUser.email })
					Sentry.captureException(e)
					// this is only checking for if the update didn't go through.
					throw new Error("Unable to update date request.")
				}
			}

			try {
				const customDate = await prisma.customDate.update({
					where: {
						id: input.customDateId,
					},
					data: {
						status: {
							connect: {
								name: input.response,
							},
						},
						lastMessageSentAt: new Date(),
						respondedAt: new Date(),
					},
					include: {
						requestor: {
							select: {
								email: true,
								username: true,
								name: true,
								id: true,
							},
						},
					},
				})
				await emailQueue.add(
					"email",
					updateDateRequestor({
						email: customDate.requestor.email,
						creatorName: currentUser.name,
						customDateId: customDate.id,
						status: input.response,
					}),
					{ attempts: 3 },
				)
				if (input.response === "accepted") {
					await publishCustomDateEvent(
						new AcceptedCustomDateEvent(customDate),
						pubsub,
					)
					// set timer to pay tastemaker
					await customDateQueue.add(
						"pay_tastemaker",
						{ customDateId: customDate.id },
						{
							delay: timeToMs("48:00"),
							attempts: 10,
							backoff: { type: "exponential", delay: 1000 },
						},
					)
				} else {
					await publishCustomDateEvent(
						new DeclinedCustomDateEvent(customDate),
						pubsub,
					)
				}
				// remove the check_acceptance job
				removeCheckAcceptance(customDate.id)
				// TODO: Remove this and put it on the client
				track(req, "Tastemaker Responded", {
					responded_at: new Date(),
					tastemaker_id: user.id,
					tastemaker_name: user.name,
					tastemaker_username: user.username,
					requestor_name: customDate.requestor.name,
					requestor_username: customDate.requestor.username,
					distinct_id: currentUser.id,
					status: input.response,
				})
				return customDate
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Could not respond to custom date")
			}
		},
	}),
}))

builder.queryFields((t) => ({
	getPendingCustomDates: t.field({
		type: ["CustomDate"],
		errors: {
			types: [AuthError, Error],
		},
		args: {
			requestor: t.arg.boolean({ required: true }),
		},
		resolve: async (_p, { requestor }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to see date requests.")
			}
			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					tastemaker: {
						select: {
							id: true,
						},
					},
				},
			})
			if (!user) {
				throw new Error("User not found")
			}
			return await prisma.customDate.findMany({
				where: {
					tastemakerId: !requestor ? user.tastemaker?.id : undefined,
					requestorId: requestor ? user.id : undefined,
					status: {
						name: "requested",
					},
				},
				orderBy: {
					createdAt: "desc",
				},
			})
		},
	}),
	getAcceptedCustomDates: t.field({
		type: ["CustomDate"],
		errors: {
			types: [AuthError, Error],
		},
		args: {
			requestor: t.arg.boolean({ required: true }),
		},
		resolve: async (_p, { requestor }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to see date requests.")
			}
			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					tastemaker: {
						select: {
							id: true,
						},
					},
				},
			})
			if (!user) {
				throw new Error("User not found")
			}
			return await prisma.customDate.findMany({
				where: {
					tastemakerId: !requestor ? user.tastemaker?.id : undefined,
					requestorId: requestor ? user.id : undefined,
					status: {
						name: "accepted",
					},
					// don't show refunded/requested refund dates.
					refund: null,
				},
				orderBy: [
					{
						lastMessageSentAt: "desc",
					},
				],
			})
		},
	}),
	getCustomDate: t.field({
		type: "CustomDate",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_p, { id }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to see date requests.")
			}
			const customDate = await prisma.customDate.findUnique({
				where: {
					id,
				},
			})

			if (!customDate) {
				throw new Error("Custom date not found")
			}
			// Check if user is the tastemaker or the requestor
			// or an admin
			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					tastemaker: {
						select: {
							id: true,
						},
					},
					role: {
						select: {
							name: true,
						},
					},
				},
			})

			if (!user) {
				throw new Error("User not found")
			}

			if (
				user.role.name === "admin" ||
				user.id === customDate.requestorId ||
				user.id === customDate.tastemakerId
			) {
				return customDate
			}

			throw new Error("You do not have permission to view this date request.")
		},
	}),
}))
