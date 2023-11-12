import { builder } from "../../builder"
import {
	dateItineraryForGuest,
	dateItineraryForViewer,
	requestorRequestedChangesEmail,
	tastemakerMadeChangesEmail,
	tastemakerSuggestedDateEmail,
	userAcceptedDateEmail,
} from "../../lib"
import { generateICSValues } from "../../lib/itinerary"
import { omit } from "../../lib/object"
import { emailQueue } from "../../lib/queue"
import { removePayTastemaker } from "../../lib/queue/custom-date"
import { GuestInput } from "../date-itinerary"
import { AuthError, FieldError, FieldErrors } from "../error"
import {
	NewCustomDateSuggestionEvent,
	publishCustomDateSuggestionEvent,
} from "../subscription/custom-date-suggestion"
import { DateTime } from "luxon"

builder.objectType("CustomDateSuggestion", {
	fields: (t) => ({
		id: t.exposeID("id"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		status: t.field({
			type: "CustomDateSuggestionStatus",
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestionStatus.findUniqueOrThrow({
					where: {
						id: p.statusId,
					},
				}),
		}),
		stops: t.field({
			type: ["CustomDateSuggestionStop"],
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestionStop.findMany({
					where: {
						suggestionId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		date: t.field({
			type: "CustomDate",
			resolve: (p, _, { prisma }) =>
				prisma.customDate.findUniqueOrThrow({
					where: {
						id: p.customDateId,
					},
				}),
		}),
	}),
})

const CustomDateSuggestionStopInput = builder.inputType(
	"CustomDateSuggestionStopInput",
	{
		fields: (t) => ({
			order: t.int({ required: true }),
			content: t.string({ required: true }),
			locationId: t.string({ required: true }),
		}),
	},
)

const SuggestCustomDateInput = builder.inputType("SuggestCustomDateInput", {
	fields: (t) => ({
		customDateId: t.string({ required: true }),
		stops: t.field({
			type: [CustomDateSuggestionStopInput],
			required: true,
		}),
	}),
})

const CustomDateSuggestionStopRequestedChangeInput = builder.inputType(
	"CustomDateSuggestionStopRequestedChangeInput",
	{
		fields: (t) => ({
			stopId: t.string({ required: true }),
			changeRequested: t.boolean({ required: true }),
			comment: t.string({ required: false }),
		}),
	},
)

const RequestChangesOnCustomDateSuggestionInput = builder.inputType(
	"RequestChangesOnCustomDateSuggestionInput",
	{
		fields: (t) => ({
			suggestionId: t.string({ required: true }),
			stops: t.field({
				type: [CustomDateSuggestionStopRequestedChangeInput],
				required: true,
			}),
		}),
	},
)

const AcceptCustomDateSuggestionInput = builder.inputType(
	"AcceptCustomDateSuggestionInput",
	{
		fields: (t) => ({
			customDateId: t.string({ required: true }),
			timeZone: t.string({ required: true }),
			guest: t.field({ type: GuestInput, required: false }),
		}),
	},
)

const MakeChangesOnSuggestionInput = builder.inputType(
	"MakeChangesOnSuggestionInput",
	{
		fields: (t) => ({
			customDateId: t.string({ required: true }),
			stops: t.field({
				type: [MakeChangeOnStopInput],
				required: true,
			}),
		}),
	},
)

const MakeChangeOnStopInput = builder.inputType("MakeChangeOnStopInput", {
	fields: (t) => ({
		stopId: t.string({ required: true }),
		content: t.string({ required: true }),
		locationId: t.string({ required: true }),
		order: t.int({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	suggestCustomDate: t.field({
		type: "CustomDateSuggestion",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({
				type: SuggestCustomDateInput,
				required: true,
			}),
		},
		resolve: async (_, { input }, { prisma, currentUser, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to create a date suggestion")
			}

			const customDate = await prisma.customDate.findUnique({
				where: {
					id: input.customDateId,
				},
				include: {
					suggestions: {
						select: {
							revisionNumber: true,
						},
						orderBy: {
							revisionNumber: "desc",
						},
					},
					tastemaker: {
						select: {
							user: {
								select: {
									name: true,
								},
							},
						},
					},
					requestor: {
						select: {
							email: true,
						},
					},
				},
			})

			if (!customDate) {
				throw new Error("Custom date not found")
			}

			const status = await prisma.customDateSuggestionStatus.findUnique({
				where: {
					name: "suggested",
				},
			})

			if (!status) {
				throw new Error("Suggestion status not found")
			}
			try {
				return await prisma.$transaction(async (tx) => {
					await tx.customDate.update({
						where: {
							id: customDate.id,
						},
						data: {
							// not technically sending a message
							// but the tastemaker did something
							// to push it to the top.
							lastMessageSentAt: new Date(),
						},
					})
					const newSuggestion = await tx.customDateSuggestion.create({
						data: {
							customDateId: customDate.id,
							revisionNumber: 0,
							stops: {
								createMany: {
									data: input.stops,
								},
							},
							statusId: status.id,
						},
					})
					await emailQueue.add(
						"email",
						tastemakerSuggestedDateEmail({
							to: customDate.requestor.email,
							customDateId: customDate.id,
							tastemakerName: customDate.tastemaker.user.name,
						}),
					)
					await publishCustomDateSuggestionEvent(
						new NewCustomDateSuggestionEvent(newSuggestion),
						pubsub,
					)
					return newSuggestion
				})
			} catch {
				throw new Error("Unable to create suggestion.")
			}
		},
	}),
	// We need this to be a different thing
	// than the first submit because there are
	// different params you need to check for
	// that are unnecessary for the first submit.
	makeChangesOnSuggestion: t.field({
		type: "CustomDateSuggestion",
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({
				type: MakeChangesOnSuggestionInput,
				required: true,
			}),
		},
		resolve: async (_, { input }, { prisma, currentUser, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to make changes")
			}

			const suggestion = await prisma.customDateSuggestion.findFirst({
				where: {
					customDateId: input.customDateId,
				},
				orderBy: {
					revisionNumber: "desc",
				},
				include: {
					status: {
						select: {
							name: true,
						},
					},
					stops: {
						select: {
							id: true,
							change: {
								select: {
									id: true,
								},
							},
							locationId: true,
						},
					},
					customDate: {
						select: {
							id: true,
							requestor: {
								select: {
									email: true,
								},
							},
							tastemaker: {
								select: {
									user: {
										select: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			})

			if (!suggestion) {
				throw new Error("Suggestion not found")
			}

			if (suggestion.customDate.tastemaker.user.id !== currentUser.id) {
				throw new AuthError("You do not have permission to make changes")
			}

			if (suggestion.status.name !== "changes requested") {
				throw new Error("Cannot make changes on this suggestion")
			}

			// loop through stops and make sure the ones that needed to be changed
			// are changed.
			const errors: FieldError[] = []
			for (const [index, stop] of input.stops.entries()) {
				const oldStop = suggestion.stops.find((s) => s.id === stop.stopId)
				// check if there is a change requested
				// and no change was made.
				if (oldStop?.change?.id && oldStop?.locationId === stop.locationId) {
					errors.push(
						new FieldError(
							`stops.${index}.location.id`,
							"Must change location",
						),
					)
				}
			}
			// if there are any errors, throw them.
			if (errors.length > 0) {
				throw new FieldErrors(errors)
			}
			// get new status
			const status = await prisma.customDateSuggestionStatus.findUnique({
				where: {
					name: "suggested",
				},
			})

			if (!status) {
				throw new Error("Suggestion status not found")
			}
			// create the new suggestion
			try {
				return await prisma.$transaction(async (tx) => {
					await tx.customDate.update({
						where: {
							id: suggestion.customDate.id,
						},
						data: {
							// not technically sending a message
							// but the tastemaker did something
							// to push it to the top.
							lastMessageSentAt: new Date(),
						},
					})
					const newSuggestion = await tx.customDateSuggestion.create({
						data: {
							customDateId: suggestion.customDate.id,
							revisionNumber: suggestion.revisionNumber + 1,
							stops: {
								createMany: {
									data: input.stops.map((s) => ({ ...omit(s, "stopId") })),
								},
							},
							statusId: status.id,
						},
					})
					await emailQueue.add(
						"email",
						tastemakerMadeChangesEmail({
							customDateId: suggestion.customDate.id,
							tastemakerName: suggestion.customDate.tastemaker.user.name,
							to: suggestion.customDate.requestor.email,
						}),
					)
					await publishCustomDateSuggestionEvent(
						new NewCustomDateSuggestionEvent(newSuggestion),
						pubsub,
					)
					return newSuggestion
				})
			} catch {
				throw new Error("Unable to create suggestion.")
			}
		},
	}),
	requestChangesOnCustomDateSuggestion: t.field({
		type: "CustomDateSuggestion",
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({
				type: RequestChangesOnCustomDateSuggestionInput,
				required: true,
			}),
		},
		resolve: async (_p, { input }, { currentUser, prisma, pubsub }) => {
			if (!currentUser) {
				throw new AuthError(
					"You must be logged in to request changes on a date suggestion",
				)
			}

			const suggestion = await prisma.customDateSuggestion.findUnique({
				where: {
					id: input.suggestionId,
				},
				include: {
					customDate: {
						select: {
							id: true,
							requestorId: true,
							tastemaker: {
								select: {
									user: {
										select: {
											email: true,
										},
									},
								},
							},
						},
					},
				},
			})

			// check to make sure suggestion exists
			if (!suggestion) {
				throw new Error("Suggestion not found")
			}

			// check to make sure user requesting change is the requestor
			if (suggestion.customDate.requestorId !== currentUser.id) {
				throw new AuthError(
					"You do not have permission to request changes on this suggestion",
				)
			}

			const errors: FieldError[] = []
			for (let i = 0; i < input.stops.length; i++) {
				const change = input.stops[i]
				if (!change?.changeRequested) continue // if no changes requested, skip.
				const stop = await prisma.customDateSuggestionStop.findUnique({
					where: {
						id: change?.stopId,
					},
				})
				if (!stop) {
					errors.push(new FieldError(`stops.${i}`, "Stop not found"))
				}
			}
			if (errors.length > 0) {
				throw new FieldErrors(errors)
			}
			// get new status
			const status = await prisma.customDateSuggestionStatus.findUnique({
				where: {
					name: "changes requested",
				},
			})

			if (!status) {
				throw new Error("Suggestion status not found")
			}

			// update the suggestion
			try {
				return await prisma.$transaction(async (tx) => {
					const newSuggestion = await tx.customDateSuggestion.update({
						where: {
							id: suggestion.id,
						},
						data: {
							statusId: status.id,
						},
					})
					await tx.customDate.update({
						where: {
							id: suggestion.customDate.id,
						},
						data: {
							// update this when a user requests changes
							// so it pops to the top.
							lastMessageSentAt: new Date(),
						},
					})
					// Need to now filter out the stops that don't have changes requested
					// because we don't care about the index for returning errors.
					const filteredStops = input.stops
						.filter((s) => s.changeRequested)
						.map((s) => ({ ...omit(s, "changeRequested") })) as {
						stopId: string
						comment: string
					}[]
					for (const stop of filteredStops) {
						await tx.customDateSuggestionStopRequestedChange.create({
							data: stop,
						})
					}
					await emailQueue.add(
						"email",
						requestorRequestedChangesEmail({
							to: suggestion.customDate.tastemaker.user.email,
							customDateId: suggestion.customDate.id,
							requestorName: currentUser.name,
						}),
					)
					await publishCustomDateSuggestionEvent(
						new NewCustomDateSuggestionEvent(newSuggestion),
						pubsub,
					)
					return newSuggestion
				})
			} catch {
				throw new Error("Unable to request changes on suggestion.")
			}
		},
	}),
	acceptCustomDateSuggestion: t.field({
		type: "CustomDateSuggestion",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: AcceptCustomDateSuggestionInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser, prisma, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to accept a date suggestion")
			}

			const suggestion = await prisma.customDateSuggestion.findFirst({
				where: {
					customDateId: input.customDateId,
				},
				orderBy: {
					revisionNumber: "desc",
				},
				include: {
					stops: {
						select: {
							content: true,
							location: {
								select: {
									name: true,
									website: true,
									address: {
										select: {
											street: true,
											postalCode: true,
											city: {
												include: {
													state: true,
												},
											},
										},
									},
								},
							},
						},
					},
					customDate: {
						select: {
							beginsAt: true,
							id: true,
							requestorId: true,
							tastemaker: {
								select: {
									user: {
										select: {
											email: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			})

			// check to make sure suggestion exists
			if (!suggestion) {
				throw new Error("Suggestion not found")
			}

			// check to make sure user accepting suggestion is the requestor
			if (suggestion.customDate.requestorId !== currentUser.id) {
				throw new AuthError(
					"You do not have permission to accept this suggestion",
				)
			}

			// get new status
			const status = await prisma.customDateSuggestionStatus.findUnique({
				where: {
					name: "accepted",
				},
			})

			if (!status) {
				throw new Error("Suggestion status not found")
			}

			// update the suggestion
			try {
				return await prisma.$transaction(async (tx) => {
					const newSuggestion = await tx.customDateSuggestion.update({
						where: {
							id: suggestion.id,
						},
						data: {
							statusId: status.id,
						},
					})
					await tx.customDate.update({
						where: {
							id: suggestion.customDate.id,
						},
						data: {
							completed: true,
							lastMessageSentAt: new Date(),
						},
					})

					// TODO: pay the tastemaker

					await removePayTastemaker(suggestion.customDate.id)

					await emailQueue.add(
						"email",
						userAcceptedDateEmail({
							to: suggestion.customDate.tastemaker.user.email,
							requestorName: currentUser.name,
						}),
					)
					const validDate = DateTime.fromISO(
						suggestion.customDate.beginsAt.toISOString(),
					).setZone(input.timeZone)
					const icsValues = generateICSValues({
						date: validDate,
						currentUser,
						guest: input.guest
							? {
									email: input.guest.email,
									name: input.guest.name || undefined,
							  }
							: undefined,
						stops: suggestion.stops.map((s) => ({
							content: s.content,
							location: s.location,
							title: s.location.name,
						})),
					})
					await emailQueue.add(
						"email",
						dateItineraryForViewer({
							email: currentUser.email,
							date: validDate,
							icsValues,
							guestName: input.guest?.name,
							stops: suggestion.stops.map((s) => s.location.name),
							subject: input.guest?.name
								? `${currentUser.name}, get ready for your date with ${input.guest.name}!`
								: `${currentUser.name}, get ready for your date!`,
							title: `a custom date by ${suggestion.customDate.tastemaker.user.name}`,
						}),
						{ attempts: 10, backoff: { type: "exponential", delay: 1000 } },
					)
					if (input.guest?.email) {
						await emailQueue.add(
							"email",
							dateItineraryForGuest({
								email: input.guest.email,
								date: validDate,
								subject: input.guest.name
									? `${input.guest.name}, get ready for your date with ${currentUser.name}!`
									: `${currentUser.name} invited you on a date!`,
								icsValues,
								name: input.guest.name,
								inviterName: currentUser.name,
								stops: suggestion.stops.map((stop) => stop.location.name),
								title: `a custom date by ${suggestion.customDate.tastemaker.user.name}`,
							}),
							{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
						)
					}
					await publishCustomDateSuggestionEvent(
						new NewCustomDateSuggestionEvent(newSuggestion),
						pubsub,
					)
					return newSuggestion
				})
			} catch {
				throw new Error("Unable to accept suggestion.")
			}
		},
	}),
}))
