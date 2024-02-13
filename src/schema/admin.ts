import * as Sentry from "@sentry/node"
import { builder } from "../builder"
import { DateCreatorsResult } from "./date-creator"
import { AuthError } from "./error"
import { FreeDatesByCity } from "./free-date"

const SuggestDateInput = builder.inputType("SuggestDateInput", {
	fields: (t) => ({
		cities: t.stringList(),
		text: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	suggestDate: t.field({
		type: "DateSuggestion",
		errors: {
			types: [AuthError, Error],
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
			} catch (e) {
				Sentry.setUser({ id: user.id, email: user.email })
				Sentry.captureException(e)
				throw new Error("Could not create date suggestion.")
			}
		},
	}),
}))

builder.queryFields((t) => ({
	freeDatesByCity: t.field({
		type: [FreeDatesByCity],
		resolve: async (_p, _a, { prisma }) => {
			const allDates = await prisma.freeDate.findMany({
				select: {
					orderedStops: {
						select: {
							options: {
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
					},
				},
			})

			const allStops = allDates.flatMap((date) =>
				date.orderedStops.map((stop) => stop.options),
			)

			const cities = allStops.flatMap((stop) =>
				stop.map((option) => option.location.address.city.name),
			)

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
					numFreeDates: cityCount[city.name] || 0,
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
				.sort((a, b) => b.numFreeDates - a.numFreeDates)
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
					freeDates: {
						some: {
							archived: false,
						},
					},
				},
				orderBy: {
					freeDates: {
						_count: "desc",
					},
				},
				include: {
					freeDates: {
						where: {
							archived: false,
						},
					},
				},
			})

			const averageNumOfFreeDates =
				tastemakers.reduce((acc, tastemaker) => {
					return acc + tastemaker.freeDates.length
				}, 0) / tastemakers.length

			const creators = tastemakers.map((tastemaker) => ({
				tastemaker,
				numFreeDates: tastemaker.freeDates.length,
			}))

			return {
				creators,
				averageNumOfFreeDates,
			}
		},
	}),
	freeDateDrafts: t.field({
		// TODO: Add pagination
		type: ["FreeDateDraft"],
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

			return await prisma.freeDateDraft.findMany()
		},
	}),
}))
