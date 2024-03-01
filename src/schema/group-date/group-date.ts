import { builder } from "../../builder"
import { generateTravelBetweenLocations, track } from "../../lib"
import { CreateGroupDateAddOnInput } from "./add-on"
import { CreateGroupDateOrderedStopInput } from "./ordered-stop"
import { CreateGroupDateProductInput } from "./product"

builder.objectType("GroupDate", {
	fields: (t) => ({
		id: t.exposeString("id"),
		title: t.exposeString("title"),
		createdAt: t.field({ type: "DateTime", resolve: (p) => p.createdAt }),
		updatedAt: t.field({ type: "DateTime", resolve: (p) => p.updatedAt }),
		startDate: t.field({ type: "DateTime", resolve: (p) => p.startDate }),
		lastSignupDate: t.field({
			type: "DateTime",
			resolve: (p) => p.lastSignupDate,
		}),
		canStillSignup: t.field({
			type: "Boolean",
			resolve: (p) => p.lastSignupDate > new Date(),
		}),
		description: t.exposeString("description"),
		minimumPrice: t.exposeInt("minimumPrice"),
		maximumPrice: t.exposeInt("maximumPrice"),
		image: t.exposeString("image"),
		numSpots: t.exposeInt("numSpots"),
		userWaitlistGroup: t.field({
			type: "GroupDateWaitlistGroup",
			nullable: true,
			resolve: async (p, _a, { prisma, currentUser }) => {
				// get the waitlist
				if (!currentUser) {
					return null
				}
				const waitlistGroup = await prisma.groupDateWaitlistGroup.findFirst({
					where: {
						AND: [
							{
								groupDateWaitlist: {
									groupDateId: p.id,
								},
							},
							{
								users: {
									some: {
										id: currentUser?.id,
									},
								},
							},
						],
					},
				})
				if (!waitlistGroup) {
					return null
				}
				return waitlistGroup
			},
		}),
		cities: t.field({
			type: ["City"],
			resolve: async (p, _a, { prisma }) =>
				prisma.city.findMany({
					orderBy: {
						name: "asc",
					},
					where: {
						addresses: {
							some: {
								locations: {
									some: {
										groupDateOrderedStops: {
											some: {
												groupDateId: p.id,
											},
										},
									},
								},
							},
						},
					},
				}),
		}),
		numUsersSignedUp: t.field({
			type: "Int",
			resolve: async (p, _a, { prisma }) =>
				prisma.user.count({
					where: {
						waitlistGroups: {
							some: {
								groupDateWaitlist: {
									groupDateId: p.id,
								},
							},
						},
					},
				}),
		}),
		tastemaker: t.field({
			type: "Tastemaker",
			nullable: false,
			resolve: async (p, _a, { prisma }) => {
				const tastemaker = await prisma.tastemaker.findUnique({
					where: {
						id: p.tastemakerId,
					},
				})
				if (!tastemaker) {
					throw new Error("Tastemaker not found")
				}
				return tastemaker
			},
		}),
		products: t.field({
			type: ["GroupDateProduct"],
			resolve: async (p, _a, { prisma }) =>
				prisma.groupDateProduct.findMany({
					where: {
						groupDateId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		addOns: t.field({
			type: ["GroupDateAddOn"],
			resolve: async (p, _a, { prisma }) =>
				prisma.groupDateAddOn.findMany({
					where: {
						groupDateId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		stops: t.field({
			type: ["GroupDateOrderedStop"],
			resolve: async (p, _a, { prisma }) =>
				prisma.groupDateOrderedStop.findMany({
					where: {
						groupDateId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		waitlist: t.field({
			type: ["GroupDateWaitlist"],
			resolve: async (p, _a, { prisma }) =>
				prisma.groupDateWaitlist.findMany({
					where: {
						groupDateId: p.id,
					},
				}),
		}),
	}),
})

builder.queryFields((t) => ({
	groupDates: t.field({
		type: ["GroupDate"],
		resolve: (_root, _a, { prisma }) =>
			prisma.groupDate.findMany({
				orderBy: {
					waitlist: {
						groups: {
							_count: "desc",
						},
					},
				},
			}),
	}),
	groupDate: t.field({
		type: "GroupDate",
		errors: {
			types: [Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_root, { id }, { prisma, req }) => {
			const groupDate = await prisma.groupDate.findUnique({
				where: {
					id,
				},
				include: {
					tastemaker: {
						include: {
							user: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			})
			if (!groupDate) {
				throw new Error("Group date not found")
			}
			// analytics
			track(req, "Group Date Viewed", {
				group_date_title: groupDate.title,
				tastemaker_name: groupDate.tastemaker.user.name,
			})
			return groupDate
		},
	}),
}))

const CreateGroupDateInput = builder.inputType("CreateGroupDateInput", {
	fields: (t) => ({
		title: t.string({ required: true }),
		description: t.string({ required: true }),
		image: t.string({ required: true }),
		numSpots: t.int({ required: true }),
		minimumPrice: t.int({ required: true }),
		maximumPrice: t.int({ required: true }),
		// will need this as they aren't personally creating this,
		// I am. so i need to know who to attribute it to.
		userId: t.string({ required: true }),
		stops: t.field({
			type: [CreateGroupDateOrderedStopInput],
			required: true,
		}),
		products: t.field({
			type: [CreateGroupDateProductInput],
			required: true,
		}),
		addOns: t.field({
			type: [CreateGroupDateAddOnInput],
		}),
	}),
})

builder.mutationFields((t) => ({
	createGroupDate: t.field({
		type: "GroupDate",
		args: {
			input: t.arg({ type: CreateGroupDateInput, required: true }),
		},
		resolve: async (_root, { input }, { prisma }) => {
			// make sure the tastemaker exists
			const tastemaker = await prisma.tastemaker.findUnique({
				where: {
					userId: input.userId,
				},
			})
			if (!tastemaker) {
				throw new Error("Tastemaker not found")
			}

			// transaction
			// create travel between locations
			// create groupDate
			return prisma.$transaction(async (tx) => {
				// get location ids from stops in order
				const locationIds = input.stops.map((stop) => stop.locationId)

				for (const [i, location] of locationIds.entries()) {
					// get next location
					const nextLocation = locationIds[i + 1]
					if (!nextLocation) break
					await generateTravelBetweenLocations(tx, location, nextLocation)
				}

				return tx.groupDate.create({
					data: {
						title: input.title,
						description: input.description,
						maximumPrice: input.maximumPrice,
						minimumPrice: input.minimumPrice,
						numSpots: input.numSpots,
						image: input.image,
						tastemakerId: tastemaker.id,
						waitlist: {
							create: {
								// this is the default waitlist
								// it's empty to start
							},
						},
						stops: {
							create: input.stops.map((stop) => ({
								order: stop.order,
								locationId: stop.locationId,
								description: stop.description,
							})),
						},
						products: {
							create: input.products.map((product) => ({
								name: product.name,
								order: product.order,
								description: product.description,
								image: product.image,
							})),
						},
						addOns: {
							create: input.addOns?.map((addOn) => ({
								name: addOn.name,
								order: addOn.order,
								description: addOn.description,
								maximumPrice: addOn.maximumPrice,
								minimumPrice: addOn.minimumPrice,
								image: addOn.image,
							})),
						},
					},
				})
			})
		},
	}),
}))
