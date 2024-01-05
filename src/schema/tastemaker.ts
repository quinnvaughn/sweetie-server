import { City, Tag } from "@prisma/client"
import * as Sentry from "@sentry/node"
import { z } from "zod"
import { builder } from "../builder"
import { track } from "../lib"
import { AuthError, FieldError, FieldErrors } from "./error"

builder.objectType("Tastemaker", {
	fields: (t) => ({
		id: t.exposeID("id"),
		price: t.exposeInt("price"),
		isPartiallySetup: t.exposeBoolean("isPartiallySetup"),
		isSetup: t.exposeBoolean("isSetup"),
		minNumStops: t.exposeInt("minNumStops"),
		maxNumStops: t.exposeInt("maxNumStops", { nullable: true }),
		formattedPrice: t.string({
			resolve: (p) => {
				const price = p.price / 100
				return `$${price.toFixed(2)}`
			},
		}),
		freeDates: t.field({
			type: ["FreeDate"],
			args: {
				retired: t.arg.boolean({ required: false }),
			},
			resolve: async (p, { retired }, { prisma }) => {
				return await prisma.freeDate.findMany({
					where: {
						tastemakerId: p.id,
						retired: retired ? retired : false,
					},
					orderBy: {
						updatedAt: "desc",
					},
				})
			},
		}),
		user: t.field({
			type: "User",
			resolve: async (p, _, { prisma }) => {
				return await prisma.user.findUniqueOrThrow({
					where: {
						id: p.userId,
					},
				})
			},
		}),
		customDates: t.field({
			type: ["CustomDate"],
			resolve: async (p, _, { prisma }) => {
				return await prisma.customDate.findMany({
					where: {
						tastemakerId: p.userId,
					},
				})
			},
		}),
		specializesIn: t.field({
			type: "TastemakerPreference",
			nullable: true,
			resolve: async (p, _, { prisma }) => {
				const user = await prisma.user.findUnique({
					where: {
						id: p.userId,
					},
					include: {
						tastemaker: {
							select: {
								id: true,
							},
						},
					},
				})
				return await prisma.tastemakerPreference.findUnique({
					where: {
						specializesInId: user?.tastemaker?.id,
					},
					include: {
						cities: true,
						tags: true,
					},
				})
			},
		}),
		doesNotDo: t.field({
			type: "TastemakerPreference",
			nullable: true,
			resolve: async (p, _, { prisma }) => {
				const user = await prisma.user.findUnique({
					where: {
						id: p.userId,
					},
					include: {
						tastemaker: {
							select: {
								id: true,
							},
						},
					},
				})
				return await prisma.tastemakerPreference.findUnique({
					where: {
						doesNotDoId: user?.tastemaker?.id,
					},
					include: {
						cities: true,
						tags: true,
					},
				})
			},
		}),
	}),
})

builder.queryFields((t) => ({
	getTastemakerProfile: t.field({
		type: "Tastemaker",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			username: t.arg.string({ required: true }),
		},
		resolve: async (_, { username }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to request a custom date.")
			}
			const user = await prisma.user.findUnique({
				where: {
					username: username,
				},
				include: {
					tastemaker: true,
				},
			})

			if (!user) {
				throw new Error("User not found.")
			}

			if (!user.tastemaker) {
				throw new Error("User is not a tastemaker.")
			}

			return user.tastemaker
		},
	}),
}))

const CreateTastemakerProfileInput = builder.inputType(
	"CreateTastemakerProfileInput",
	{
		fields: (t) => ({
			price: t.int({ required: true }),
			specializesIn: t.field({
				type: TastemakerPreferenceInput,
			}),
			doesNotDo: t.field({
				type: TastemakerPreferenceInput,
			}),
			minNumStops: t.int(),
			maxNumStops: t.int(),
		}),
	},
)

const TastemakerPreferenceInput = builder.inputType(
	"TastemakerPreferenceInput",
	{
		fields: (t) => ({
			cities: t.stringList(),
			tags: t.stringList(),
		}),
	},
)

const tastemakerPreferenceSchema = z.object({
	cities: z.array(z.string()),
	tags: z.array(z.string()),
})

const createTastemakerProfileSchema = z
	.object({
		price: z.number().int().min(500, "Price per stop must be at least $5.00."),
		minNumStops: z
			.number()
			.int()
			.min(1, "Minimum number of stops must be at least 1."),
		maxNumStops: z
			.number()
			.int()
			.min(1, "Maximum number of stops must be at least 1.")
			.or(z.undefined()),
		specializesIn: tastemakerPreferenceSchema,
		doesNotDo: tastemakerPreferenceSchema,
	})
	.refine(
		(data) => {
			return !data.maxNumStops ? true : data.minNumStops <= data.maxNumStops
		},
		{
			message: "Max must be greater than or equal to min",
			path: ["maxNumStops"],
		},
	)
	.refine(
		(data) => {
			for (let i = 0; i < data.specializesIn.cities.length; i++) {
				if (
					data.doesNotDo.cities.includes(data.specializesIn.cities[i] as string)
				) {
					return false
				}
			}

			return true
		},
		{
			message: "You cannot specialize in and not do the same city.",
			path: ["specializesIn", "cities"],
		},
	)
	.refine(
		(data) => {
			for (let i = 0; i < data.specializesIn.tags.length; i++) {
				if (
					data.doesNotDo.tags.includes(data.specializesIn.tags[i] as string)
				) {
					return false
				}
			}

			return true
		},
		{
			message: "You cannot specialize in and not do the same tag.",
			path: ["specializesIn", "tags"],
		},
	)

type Preferences = {
	cities: City[]
	tags: Tag[]
}

builder.mutationFields((t) => ({
	createTastemakerProfile: t.field({
		type: "Tastemaker",
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({
				type: CreateTastemakerProfileInput,
				required: true,
			}),
		},
		resolve: async (_, { input }, { prisma, currentUser, req }) => {
			if (!currentUser) {
				throw new AuthError(
					"You must be logged in to create a tastemaker profile.",
				)
			}

			const result = createTastemakerProfileSchema.safeParse(input)

			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const { data } = result

			// every user gets a profile made on sign up
			// but it shouldn't be completed by default
			// so we check if they have a partially setup profile
			const existingTastemaker = await prisma.tastemaker.findUnique({
				where: {
					userId: currentUser.id,
					isPartiallySetup: true,
				},
			})
			if (existingTastemaker) {
				return existingTastemaker
			}

			const specializesIn: Preferences = {
				cities: [],
				tags: [],
			}

			for (let i = 0; i < data.specializesIn.cities.length; i++) {
				if (data.specializesIn.cities[i]) {
					const city = await prisma.city.findUnique({
						where: {
							id: data.specializesIn.cities[i],
						},
					})
					if (!city) {
						throw new FieldErrors([
							new FieldError(
								"specializesIn.cities",
								"One or more cities not found.",
							),
						])
					}
					specializesIn.cities.push(city)
				}
			}

			for (let i = 0; i < data.specializesIn.tags.length; i++) {
				if (data.specializesIn.tags[i]) {
					const tag = await prisma.tag.findUnique({
						where: {
							name: data.specializesIn.tags[i],
						},
					})
					if (!tag) {
						throw new FieldErrors([
							new FieldError(
								"specializesIn.tags",
								"One or more tags not found.",
							),
						])
					}
					specializesIn.tags.push(tag)
				}
			}

			const doesNotDo: Preferences = {
				cities: [],
				tags: [],
			}

			for (let i = 0; i < data.doesNotDo.cities.length; i++) {
				if (data.doesNotDo.cities[i]) {
					const city = await prisma.city.findUnique({
						where: {
							id: data.doesNotDo.cities[i],
						},
					})
					if (!city) {
						throw new FieldErrors([
							new FieldError(
								"doesNotDo.cities",
								"One or more cities not found.",
							),
						])
					}
					doesNotDo.cities.push(city)
				}
			}

			for (let i = 0; i < data.doesNotDo.tags.length; i++) {
				if (data.doesNotDo.tags[i]) {
					const tag = await prisma.tag.findUnique({
						where: {
							name: data.doesNotDo.tags[i],
						},
					})
					if (!tag) {
						throw new FieldErrors([
							new FieldError("doesNotDo.tags", "One or more tags not found."),
						])
					}
					doesNotDo.tags.push(tag)
				}
			}

			try {
				const tastemaker = await prisma.tastemaker.update({
					where: {
						userId: currentUser.id,
					},
					data: {
						price: data.price,
						minNumStops: data.minNumStops,
						maxNumStops: data.maxNumStops,
						specializesIn: {
							create: {
								cities: {
									connect: specializesIn.cities.map((c) => ({
										id: c.id,
									})),
								},
								tags: {
									connect: specializesIn.tags.map((t) => ({
										id: t.id,
									})),
								},
							},
						},
						isPartiallySetup: true,
						doesNotDo: {
							create: {
								cities: {
									connect: doesNotDo.cities.map((c) => ({
										id: c.id,
									})),
								},
								tags: {
									connect: doesNotDo.tags.map((t) => ({
										id: t.id,
									})),
								},
							},
						},
						userId: currentUser.id,
					},
				})

				// TODO: Replace this.
				track(req, "Tastemaker Profile Created", {
					distinct_id: currentUser.id,
					user_id: currentUser.id,
					user_username: currentUser.username,
					user_name: currentUser.name,
					user_email: currentUser.email,
					price: tastemaker.price,
					min_num_stops: tastemaker.minNumStops,
					max_num_stops: tastemaker.maxNumStops,
					specializes_in_cities: specializesIn.cities.map((c) => c.name),
					specializes_in_tags: specializesIn.tags.map((t) => t.name),
					does_not_do_cities: doesNotDo.cities.map((c) => c.name),
					does_not_do_tags: doesNotDo.tags.map((t) => t.name),
				})

				return tastemaker
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Unable to create tastemaker profile.")
			}
		},
	}),
}))
