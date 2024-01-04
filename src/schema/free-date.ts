import { City, FreeDate } from "@prisma/client"
import { P, match } from "ts-pattern"
import { z } from "zod"
import { builder } from "../builder"
import { config } from "../config"
import {
	ConnectionShape,
	connectionFromArraySlice,
	decodeCursor,
	distanceAndDuration,
	getDefaultFirst,
	peopleIncrement,
	peopleSet,
	track,
	viewerAuthorizedCalendar,
} from "../lib"
import { emailQueue } from "../lib/queue"
import { CreateDateStopInput, UpdateDateStopInput } from "./date-stop"
import { AuthError, FieldErrors } from "./error"
import { addConnectionFields } from "./pagination"

builder.objectType("FreeDate", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		thumbnail: t.exposeString("thumbnail"),
		description: t.exposeString("description"),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		retired: t.exposeBoolean("retired"),
		nsfw: t.exposeBoolean("nsfw"),
		exploreMore: t.field({
			type: ["FreeDate"],
			resolve: async (p, _a, { prisma }) => {
				// TODO: Make this an actual consistent thing.
				const result = await prisma.$queryRaw<
					FreeDate[]
				>`Select * from "FreeDate" where id != ${p.id} and retired = false order by random() limit 3;`
				return result ?? []
			},
		}),
		isUserTastemaker: t.boolean({
			resolve: async (p, _a, { currentUser, prisma }) => {
				if (!currentUser) {
					return false
				}
				const tastemaker = await prisma.tastemaker.findFirst({
					where: {
						userId: currentUser.id,
						id: p.tastemakerId,
					},
				})
				return !!tastemaker
			},
		}),
		recommendedTime: t.exposeString("recommendedTime"),
		tastemaker: t.field({
			type: "Tastemaker",
			resolve: async (p, _a, { prisma }) =>
				await prisma.tastemaker.findUniqueOrThrow({
					where: { id: p.tastemakerId },
				}),
		}),
		stops: t.field({
			type: ["DateStop"],
			resolve: async (p, _a, { prisma }) => {
				return await prisma.dateStop.findMany({
					where: {
						freeDateId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				})
			},
		}),
		cities: t.field({
			type: ["City"],
			resolve: async (p, _a, { prisma }) =>
				await prisma.city.findMany({
					orderBy: {
						name: "asc",
					},
					where: {
						addresses: {
							some: {
								locations: {
									some: {
										stops: {
											some: {
												freeDateId: p.id,
											},
										},
									},
								},
							},
						},
					},
				}),
		}),
		plannedDates: t.field({
			type: ["PlannedDate"],
			resolve: async (p, _a, { prisma, currentUser }) => {
				const tastemaker = await prisma.tastemaker.findUnique({
					where: {
						id: p.tastemakerId,
					},
				})
				if (currentUser?.id !== tastemaker?.userId) return []
				return await prisma.plannedDate.findMany({
					where: { freeDateId: p.id },
				})
			},
		}),
		numPlannedDates: t.int({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// get tastemaker
				const tastemaker = await prisma.tastemaker.findUnique({
					where: {
						id: p.tastemakerId,
					},
				})
				if (currentUser?.id !== tastemaker?.userId) return 0
				return await prisma.plannedDate.count({ where: { freeDateId: p.id } })
			},
		}),
		favoriteCount: t.int({
			resolve: async (p, _a, { prisma, currentUser }) => {
				// get tastemaker
				const tastemaker = await prisma.tastemaker.findUnique({
					where: {
						id: p.tastemakerId,
					},
				})
				if (currentUser?.id !== tastemaker?.userId) return 0
				const count = await prisma.favorite.count({
					where: {
						freeDateId: p.id,
					},
				})
				return count
			},
		}),
		tags: t.field({
			type: ["Tag"],
			resolve: async (p, _a, { prisma }) =>
				await prisma.tag.findMany({
					where: {
						freeDates: {
							some: {
								id: p.id,
							},
						},
					},
				}),
		}),
		viewerAuthorizedGoogleCalendar: t.boolean({
			resolve: async (_p, _a, { currentUser }) => {
				if (!currentUser) return false
				return await viewerAuthorizedCalendar(currentUser)
			},
		}),
		viewerFavorited: t.field({
			type: "Boolean",
			resolve: async (p, _a, { prisma, currentUser }) => {
				if (!currentUser) {
					return false
				}
				const favoritedDate = await prisma.favorite.findUnique({
					where: {
						userId_freeDateId: {
							userId: currentUser.id,
							freeDateId: p.id,
						},
					},
				})
				return !!favoritedDate
			},
		}),
		views: t.field({
			type: "FreeDateViews",
			nullable: true,
			resolve: async (p, _a, { prisma }) =>
				await prisma.freeDateViews.findUnique({
					where: { freeDateId: p.id },
				}),
		}),
	}),
})

const CreateFreeDateInput = builder.inputType("CreateFreeDateInput", {
	fields: (t) => ({
		draftId: t.string(),
		thumbnail: t.string({ required: true }),
		title: t.string({ required: true }),
		description: t.string({ required: true }),
		nsfw: t.boolean({ required: true }),
		recommendedTime: t.string({ required: true }),
		stops: t.field({
			type: [CreateDateStopInput],
			required: true,
		}),
		tags: t.stringList(),
	}),
})

const UpdateFreeDateInput = builder.inputType("UpdateFreeDateInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
		thumbnail: t.string(),
		title: t.string(),
		description: t.string(),
		nsfw: t.boolean(),
		recommendedTime: t.string(),
		stops: t.field({
			type: [UpdateDateStopInput],
		}),
		tags: t.stringList(),
	}),
})

const RetireFreeDateInput = builder.inputType("RetireFreeDateInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
})

const UnretireFreeDateInput = builder.inputType("UnretireFreeDateInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
})

const HelpFindingADateInput = builder.inputType("HelpFindingADateInput", {
	fields: (t) => ({
		email: t.string({ required: false }),
		name: t.string({ required: false }),
		lookingFor: t.string({ required: true }),
	}),
})

const helpFindingADateSchema = z.object({
	email: z.string().email("Must be a valid email").optional(),
	name: z.string().min(2, "Must have a name.").optional(),
	lookingFor: z.string().min(10, "Must be at least 10 characters."),
})

const createFreeDateSchema = z.object({
	draftId: z.string().optional(),
	thumbnail: z.string().url("Thumbnail must be a valid URL."),
	nsfw: z.boolean({ required_error: "Must have a NSFW value." }),
	tags: z.array(z.string()),
	title: z
		.string()
		.min(5, "Title must be at least 5 characters.")
		.max(500, "Title must be no more than 500 characters."),
	description: z
		.string()
		.min(10, "Description must be at least 5 characters.")
		.max(10000, "Description must be no more than 10,000 characters."),
	recommendedTime: z.string(),
	stops: z
		.array(
			z.object({
				title: z
					.string()
					.min(5, "Title must be at least 5 characters.")
					.max(500, "Title must be no more than 500 characters."),
				content: z
					.string()
					.min(100, "Content must be at least 100 characters.")
					.max(100000, "Content must be no more than 100,000 characters."),
				order: z.number().min(1, "Order must be at least 1."),
				location: z.object({
					id: z.string().min(1, "Must have a location ID."),
					name: z.string().min(1, "Must have a location name."),
				}),
				estimatedTime: z.number().min(1, "Estimated time must be at least 1."),
			}),
		)
		.min(1, "Must have at least one date stop."),
})

export const updateDateSchema = z.object({
	id: z.string().min(1, "Must have an ID."),
	thumbnail: z.string().url("Thumbnail must be a valid URL.").optional(),
	nsfw: z.boolean().optional(),
	tags: createFreeDateSchema.shape.tags.optional(),
	recommendedTime: z.string().optional(),
	title: z
		.string()
		.min(5, "Title must be at least 5 characters.")
		.max(500, "Title must be no more than 500 characters.")
		.optional(),
	description: z
		.string()
		.min(10, "Description must be at least 5 characters.")
		.max(10000, "Description must be no more than 10,000 characters.")
		.optional(),
	stops: createFreeDateSchema.shape.stops.optional(),
})

const deleteFreeDateSchema = z.object({
	id: z.string().min(1, "Must have an ID."),
})

builder.mutationFields((t) => ({
	unretireFreeDate: t.field({
		type: "FreeDate",
		args: {
			input: t.arg({ type: UnretireFreeDateInput, required: true }),
		},
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser, req }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to unretire a date.")
			}
			const result = deleteFreeDateSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { id } = result.data
			const date = await prisma.freeDate.findUnique({
				where: { id },
				include: {
					tastemaker: {
						select: {
							userId: true,
						},
					},
				},
			})
			if (!date) {
				throw new Error("Date not found.")
			}
			if (date.tastemaker.userId !== currentUser.id) {
				throw new AuthError("You do not have permission to unretire this date.")
			}
			try {
				const freeDate = await prisma.freeDate.update({
					where: { id },
					data: {
						retired: false,
					},
				})
				track(req, "Free Date Unretired", {
					title: freeDate.title,
					tastemaker_username: currentUser.username,
				})
				return freeDate
			} catch {
				throw new Error("Could not unretire date.")
			}
		},
	}),
	retireFreeDate: t.field({
		type: "FreeDate",
		args: {
			input: t.arg({ type: RetireFreeDateInput, required: true }),
		},
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser, req }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to retire a date.")
			}
			const result = deleteFreeDateSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { id } = result.data
			const date = await prisma.freeDate.findUnique({
				where: { id },
				include: {
					tastemaker: {
						select: {
							userId: true,
						},
					},
				},
			})
			if (!date) {
				throw new Error("Date not found.")
			}
			if (date.tastemaker.userId !== currentUser.id) {
				throw new AuthError("You do not have permission to retire this date.")
			}
			try {
				const freeDate = await prisma.freeDate.update({
					where: { id },
					data: {
						retired: true,
					},
				})
				track(req, "Free Date Retired", {
					title: freeDate.title,
					tastemaker_username: currentUser.username,
				})
				return freeDate
			} catch {
				throw new Error("Could not retire date.")
			}
		},
	}),
	createFreeDate: t.field({
		type: "FreeDate",
		args: {
			input: t.arg({ type: CreateFreeDateInput, required: true }),
		},
		errors: {
			types: [AuthError, FieldErrors, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser, req }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to create a date.")
			}
			const result = createFreeDateSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { data } = result
			try {
				// delete the draft and create the actual date.
				if (data.draftId) {
					await prisma.freeDateDraft.delete({
						where: { id: data.draftId },
					})
				}
				const freeDate = await prisma.freeDate.create({
					include: {
						stops: {
							include: {
								originTravel: {
									include: {
										duration: true,
									},
								},
								location: {
									include: {
										address: {
											include: {
												coordinates: true,
											},
										},
									},
								},
							},
						},
					},
					data: {
						thumbnail: data.thumbnail,
						title: data.title,
						description: data.description,
						recommendedTime: data.recommendedTime,
						tags: {
							connectOrCreate: data.tags
								.map((t) => t.toLowerCase())
								.map((name) => ({
									where: {
										name,
									},
									create: {
										name,
									},
								})),
						},
						nsfw: data.nsfw,
						views: {
							create: {
								views: 0,
							},
						},
						stops: {
							create: data.stops.map((stop) => ({
								title: stop.title,
								content: stop.content,
								order: stop.order,
								estimatedTime: stop.estimatedTime,
								location: {
									connect: {
										id: stop.location.id,
									},
								},
							})),
						},
						tastemaker: {
							connect: {
								userId: currentUser.id,
							},
						},
					},
				})
				await distanceAndDuration(prisma, freeDate.stops)
				track(req, "Free Date Created", {
					title: freeDate.title,
					tastermaker_username: currentUser.username,
					tastemaker_name: currentUser.name,
					num_stops: result.data.stops.length,
					recommended_time: result.data.recommendedTime,
					estimated_date_time_minutes: freeDate.stops
						.map((s) => ({
							time: s.estimatedTime,
							// this is in seconds
							// convert to minutes
							travel: s.originTravel?.duration?.value
								? s.originTravel.duration.value / 60
								: 0,
						}))
						.reduce((a, b) => a + b.travel + b.time, 0),
					num_tags: result.data.tags?.length ?? 0,
					nsfw: result.data.nsfw,
					tags: result.data.tags ?? [],
				})
				peopleIncrement(req, { num_free_dates: 1 })
				peopleSet(req, { last_created_free_date_at: new Date().toISOString() })
				return freeDate
			} catch {
				throw new Error("Could not create date.")
			}
		},
	}),
	updateFreeDate: t.field({
		type: "FreeDate",
		errors: {
			types: [AuthError, FieldErrors],
		},
		args: {
			input: t.arg({ type: UpdateFreeDateInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser, prisma, req }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to update a date.")
			}
			const result = updateDateSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { data } = result
			const freeDate = await prisma.freeDate.findFirst({
				where: {
					tastemaker: {
						userId: currentUser.id,
					},
					id: data.id,
				},
				include: {
					tags: true,
				},
			})

			if (!freeDate) {
				throw new Error("Date not found.")
			}
			try {
				return await prisma.$transaction(async () => {
					// delete all old stops
					if (data.stops && data.stops.length > 0) {
						await prisma.dateStop.deleteMany({
							where: {
								freeDateId: data.id,
							},
						})
					}
					const updatedFreeDate = await prisma.freeDate.update({
						where: {
							id: data.id,
						},
						include: {
							stops: {
								include: {
									originTravel: {
										include: {
											duration: true,
										},
									},
									location: {
										include: {
											address: {
												include: {
													coordinates: true,
												},
											},
										},
									},
								},
							},
						},
						data: {
							thumbnail: data.thumbnail,
							title: data.title,
							description: data.description,
							nsfw: data.nsfw,
							recommendedTime: data.recommendedTime,
							tags: {
								// this is easier than trying to figure out which ones to delete and which ones to add
								disconnect: data.tags
									? freeDate.tags.map(({ id }) => ({ id }))
									: undefined,
								connectOrCreate: data.tags
									? data.tags
											.map((t) => t.toLowerCase())
											.map((name) => ({
												where: {
													name,
												},
												create: {
													name,
												},
											}))
									: undefined,
							},
							stops: {
								// recreate stops
								createMany: data.stops
									? {
											data: data.stops.map((stop) => ({
												title: stop.title,
												content: stop.content,
												order: stop.order,
												locationId: stop.location.id,
												estimatedTime: stop.estimatedTime,
											})),
									  }
									: undefined,
							},
						},
					})
					await distanceAndDuration(prisma, updatedFreeDate.stops)
					track(req, "Free Date Updated", {
						title: updatedFreeDate.title,
						tastermaker_username: currentUser.username,
						tastemaker_name: currentUser.name,
						estimated_date_time_minutes: updatedFreeDate.stops
							.map((s) => ({
								time: s.estimatedTime,
								// this is in seconds
								// convert to minutes
								travel: s.originTravel?.duration?.value
									? s.originTravel.duration.value / 60
									: 0,
							}))
							.reduce((a, b) => a + b.travel + b.time, 0),
						num_stops: data.stops?.length,
						recommended_time: data.recommendedTime,
						num_tags: data.tags?.length,
						nsfw: data.nsfw,
						tags: data.tags,
					})
					return updatedFreeDate
				})
			} catch {
				throw new Error("Could not update date.")
			}
		},
	}),
	helpFindingADate: t.field({
		type: "Boolean",
		args: {
			input: t.arg({ type: HelpFindingADateInput, required: true }),
		},
		errors: {
			directResult: false,
			types: [FieldErrors, Error],
		},
		resolve: async (_p, { input }, { currentUser }) => {
			if (currentUser) {
				// ignore the email if the user is logged in
				const result = helpFindingADateSchema.safeParse(input)
				if (!result.success) {
					throw new FieldErrors(result.error.issues)
				}
				const { data } = result

				await emailQueue.add("help-finding-a-date", {
					From: config.EMAIL_FROM,
					To: "quinn@trysweetie.com",
					Subject: "Help finding a date",
					HtmlBody: `<p>${currentUser.name} is looking for: <br />"${data.lookingFor}"<br />Email them at ${currentUser.email}.</p>`,
				})
				return true
			}

			const result = helpFindingADateSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { data } = result

			await emailQueue.add("help-finding-a-date", {
				From: config.EMAIL_FROM,
				To: "quinn@trysweetie.com",
				Subject: "Help finding a date",
				HtmlBody: `<p>${data.name} is looking for: <br />"${data.lookingFor}"<br />Email them at ${data.email}.</p>`,
			})
			return true
		},
	}),
}))

export const FreeDateConnection = builder
	.objectRef<ConnectionShape<FreeDate>>("FreeDateConnection")
	.implement({})

addConnectionFields(FreeDateConnection)

export const FreeDatesByCity = builder
	.objectRef<{ city: string; numFreeDates: number }>("FreeDatesByCity")
	.implement({
		fields: (t) => ({
			city: t.exposeString("city"),
			numFreeDates: t.exposeInt("numFreeDates"),
		}),
	})

builder.queryFields((t) => ({
	adminFreeDates: t.field({
		type: ["FreeDate"],
		errors: {
			types: [AuthError],
		},
		resolve: async (_p, _a, { prisma, currentUser }) => {
			const adminUser = await prisma.user.findFirst({
				where: {
					role: {
						name: "admin",
					},
					id: currentUser?.id,
				},
			})

			if (!adminUser) {
				throw new AuthError("You do not have permission to view this page.")
			}

			return await prisma.freeDate.findMany({
				orderBy: {
					createdAt: "desc",
				},
			})
		},
	}),
	// this is called on home page, so it's a good proxy for viewing the home page
	featuredFreeDates: t.field({
		type: ["FreeDate"],
		resolve: async (_p, _a, { prisma, req }) => {
			track(req, "Home Page Viewed", {})
			return await prisma.freeDate.findMany({
				orderBy: {
					views: {
						views: "desc",
					},
				},
				where: {
					retired: false,
				},
				take: 15,
			})
		},
	}),
	freeDates: t.field({
		type: FreeDateConnection,
		args: {
			after: t.arg.string(),
			first: t.arg.int(),
			query: t.arg.string(),
			cities: t.arg.stringList(),
			nsfw: t.arg.string(),
		},
		resolve: async (
			_p,
			{ after, first, cities, nsfw, query },
			{ prisma, req },
		) => {
			// typescript not smart enough to pick up the default value
			const defaultFirst = getDefaultFirst(first)
			let decodedCursor: Date | null = null
			if (after) {
				decodedCursor = decodeCursor(after)
			}

			const allCities: Pick<City, "id">[] = []
			// get the cities by name and state initials
			// then get ids.
			if (cities && cities.length > 0) {
				for (const city of cities) {
					const [cityName, stateInitials] =
						city.split(", ").map((s) => s.trim()) ?? []
					const foundCity = await prisma.city.findFirst({
						where: {
							name: cityName,
							state: {
								initials: stateInitials,
							},
						},
						select: {
							id: true,
						},
					})

					if (foundCity) {
						allCities.push(foundCity)
					}
				}
			}

			const freeDates = await prisma.freeDate.findMany({
				orderBy: [{ views: { views: "desc" } }, { updatedAt: "desc" }],
				take: first ? defaultFirst + 1 : undefined,
				where: {
					AND: [
						{
							nsfw: nsfw === "on" ? { equals: false } : undefined,
						},
						{
							createdAt: decodedCursor ? { lt: decodedCursor } : undefined,
							retired: false,
						},
						{
							stops:
								allCities.length > 0
									? {
											some: {
												location: {
													address: {
														cityId: {
															in: allCities.map(({ id }) => id),
														},
													},
												},
											},
									  }
									: undefined,
						},
						{
							OR: [
								{
									tags: query
										? {
												some: {
													name: {
														contains: query,
														mode: "insensitive",
													},
												},
										  }
										: undefined,
								},
								{
									description: query
										? {
												contains: query,
												mode: "insensitive",
										  }
										: undefined,
								},
								{
									title: query
										? {
												contains: query,
												mode: "insensitive",
										  }
										: undefined,
								},
								{
									stops: query
										? {
												some: {
													OR: [
														{
															location: {
																name: {
																	contains: query,
																	mode: "insensitive",
																},
															},
														},
														{
															content: {
																contains: query,
																mode: "insensitive",
															},
														},
														{
															title: {
																contains: query,
																mode: "insensitive",
															},
														},
														{
															location: {
																address: {
																	city: {
																		name: {
																			contains: query,
																			mode: "insensitive",
																		},
																	},
																},
															},
														},
													],
												},
										  }
										: undefined,
								},
							],
						},
					],
				},
			})

			track(req, "User Searched", {
				for: "Free Date",
				cities,
				// setting nsfw to false if it's undefined
				nsfw: nsfw === "on",
				query,
				num_results: freeDates.length,
				has_results: freeDates.length > 0,
			})

			return connectionFromArraySlice(
				{ arraySlice: freeDates },
				{ first: defaultFirst, after },
			)
		},
	}),
	getEditFreeDate: t.field({
		type: "FreeDate",
		errors: {
			types: [Error, AuthError],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_p, { id }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to edit a date.")
			}
			const freeDate = await prisma.freeDate.findUnique({
				where: { id },
				include: {
					tastemaker: {
						include: {
							user: {
								select: {
									username: true,
									id: true,
									name: true,
								},
							},
						},
					},
					stops: {
						include: {
							location: {
								select: {
									name: true,
									address: {
										select: {
											city: {
												select: {
													name: true,
												},
											},
										},
									},
								},
							},
						},
					},
					views: {
						select: {
							id: true,
							views: true,
						},
					},
				},
			})

			if (!freeDate) {
				throw new Error("Free date not found.")
			}
			if (freeDate.tastemaker.userId !== currentUser.id) {
				throw new AuthError("You do not have permission to edit this date.")
			}
			return freeDate
		},
	}),
	freeDate: t.field({
		type: "FreeDate",
		errors: {
			types: [Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_p, { id }, { prisma, currentUser, req }) => {
			const freeDate = await prisma.freeDate.findUnique({
				where: { id },
				include: {
					tastemaker: {
						include: {
							user: {
								select: {
									username: true,
									id: true,
									name: true,
								},
							},
						},
					},
					stops: {
						include: {
							location: {
								select: {
									name: true,
									address: {
										select: {
											city: {
												select: {
													name: true,
												},
											},
										},
									},
								},
							},
						},
					},
					views: {
						select: {
							id: true,
							views: true,
						},
					},
				},
			})

			if (!freeDate) {
				throw new Error("Free date not found.")
			}
			try {
				match(freeDate.views)
					.with({ id: P.string }, async (view) => {
						if (freeDate.tastemaker.userId !== currentUser?.id) {
							// if the user is not the tastemaker, update the view count
							await prisma.freeDateViews.update({
								where: { id: view.id },
								data: {
									lastViewedAt: new Date(),
									views: view.views + 1,
								},
							})
						}
					})
					.with(P.nullish, async () => {
						await prisma.freeDateViews.create({
							data: {
								freeDateId: freeDate.id,
								lastViewedAt: new Date(),
								views: 1,
							},
						})
					})
					.otherwise(() => null)
			} catch {
				// do nothing, not super important.
			}
			track(req, "Free Date Viewed", {
				location_names: freeDate.stops.map((stop) => stop.location.name),
				location_cities: freeDate.stops.map(
					(stop) => stop.location.address.city.name,
				),
				title: freeDate.title,
				tastemaker_name: freeDate.tastemaker.user.name,
			})
			return freeDate
		},
	}),
}))
