import { builder } from "../builder"
import { MAX_NUM_FEATURED_DATES } from "../consts"
import { DateCreatorsResult } from "./date-creator"
import { ExperiencesByCity } from "./date-experience"
import {
	AuthError,
	EntityCreationError,
	EntityNotFoundError,
	EntityUpdateError,
} from "./error"

const SuggestDateInput = builder.inputType("SuggestDateInput", {
	fields: (t) => ({
		cities: t.stringList(),
		text: t.string({ required: true }),
	}),
})

const FeatureDateInput = builder.inputType("FeatureDateInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	suggestDate: t.field({
		type: "DateSuggestion",
		errors: {
			types: [AuthError, EntityCreationError],
		},
		args: {
			input: t.arg({ type: SuggestDateInput, required: true }),
		},
		resolve: async (_, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to suggest a date")
			}

			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					role: {
						select: {
							name: true,
						},
					},
				},
			})

			if (user?.role.name !== "admin") {
				throw new AuthError("You must be an admin to suggest a date")
			}

			try {
				return await prisma.dateSuggestion.create({
					data: {
						text: input.text,
						cities: {
							connect: input.cities
								? input.cities.map((city) => ({ id: city }))
								: [],
						},
					},
				})
			} catch {
				throw new EntityCreationError("date suggestion")
			}
		},
	}),
	featureDate: t.field({
		type: "DateExperience",
		errors: {
			types: [AuthError, EntityUpdateError],
		},
		args: {
			input: t.arg({ type: FeatureDateInput, required: true }),
		},
		resolve: async (_, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to feature a date")
			}

			const role = await prisma.role.findFirst({
				where: {
					users: {
						some: {
							id: currentUser.id,
						},
					},
				},
			})

			if (role?.name !== "admin") {
				throw new AuthError("You must be an admin to feature a date")
			}

			const date = await prisma.dateExperience.findUnique({
				where: {
					id: input.id,
				},
			})

			if (!date) {
				throw new EntityNotFoundError("Date experience")
			}

			// Only allowed to be four featured dates at a time
			// Must find all featured dates and count them
			// If there are four, then we must unfeature the oldest one
			const featuredDates = await prisma.dateExperience.findMany({
				where: {
					featured: true,
				},
				orderBy: {
					featuredAt: "asc",
				},
			})

			// should we make this a constant?
			if (featuredDates.length >= MAX_NUM_FEATURED_DATES) {
				const oldestFeaturedDate = featuredDates[0]
				try {
					await prisma.dateExperience.update({
						where: {
							id: oldestFeaturedDate?.id,
						},
						data: {
							featured: false,
							featuredAt: null,
						},
					})
				} catch {
					throw new EntityUpdateError("featured date")
				}
			}
			try {
				return await prisma.dateExperience.update({
					where: {
						id: input.id,
					},
					data: {
						featured: true,
						featuredAt: new Date(),
					},
				})
			} catch {
				throw new EntityUpdateError("featured date")
			}
		},
	}),
}))

builder.queryFields((t) => ({
	dateExperiencesByCity: t.field({
		type: [ExperiencesByCity],
		resolve: async (_p, _a, { prisma }) => {
			const allDates = await prisma.dateExperience.findMany({
				select: {
					stops: {
						select: {
							location: {
								select: {
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
				},
			})

			const allStops = allDates.flatMap((date) => date.stops)

			const cities = allStops.map((stop) => stop.location.address.city.name)

			const cityCount = Array.from(cities).reduce<{ [key: string]: number }>(
				(acc, curr) => {
					acc[curr] = (acc[curr] || 0) + 1
					return acc
				},
				{},
			)

			const allCities = await prisma.city.findMany({
				select: {
					name: true,
				},
			})

			return allCities
				.map((city) => ({
					city: city.name,
					numExperiences: cityCount[city.name] || 0,
				}))
				.sort((a, b) => {
					const aName = a.city.toLowerCase()
					const bName = b.city.toLowerCase()

					if (aName < bName) {
						return -1
					}
					if (aName > bName) {
						return 1
					}
					return 0
				})
				.sort((a, b) => b.numExperiences - a.numExperiences)
		},
	}),
	dateCreators: t.field({
		type: DateCreatorsResult,
		errors: {
			types: [AuthError],
		},
		resolve: async (_, __, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You are not authenticated")
			}

			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
				include: {
					role: {
						select: {
							name: true,
						},
					},
				},
			})

			if (user?.role.name !== "admin") {
				throw new AuthError("You are not authenticated")
			}

			const tastemakers = await prisma.tastemaker.findMany({
				where: {
					experiences: {
						some: {
							retired: false,
						},
					},
				},
				orderBy: {
					experiences: {
						_count: "desc",
					},
				},
				include: {
					experiences: {
						where: {
							retired: false,
						},
					},
				},
			})

			const averageNumOfExperiences =
				tastemakers.reduce((acc, tastemaker) => {
					return acc + tastemaker.experiences.length
				}, 0) / tastemakers.length

			const creators = tastemakers.map((tastemaker) => ({
				tastemaker,
				numExperiences: tastemaker.experiences.length,
			}))

			return {
				creators,
				averageNumOfExperiences,
			}
		},
	}),
	dateExperienceDrafts: t.field({
		// TODO: Add pagination
		type: ["DateExperienceDraft"],
		errors: {
			types: [AuthError],
			dataField: {
				name: "drafts",
			},
		},
		resolve: async (_p, _a, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to see all drafts")
			}

			const user = await prisma.user.findUnique({
				where: { id: currentUser.id },
				include: {
					role: {
						select: {
							name: true,
						},
					},
				},
			})

			if (user?.role.name !== "admin") {
				throw new AuthError("You must be an admin to see all drafts")
			}

			return await prisma.dateExperienceDraft.findMany()
		},
	}),
}))
