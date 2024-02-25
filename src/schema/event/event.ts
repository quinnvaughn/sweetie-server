import { generateTravelBetweenLocations } from "src/lib"
import { builder } from "../../builder"
import { CreateEventAddOnInput } from "./add-on"
import { CreateEventOrderedStopInput } from "./ordered-stop"
import { CreateEventProductInput } from "./product"

builder.objectType("Event", {
	fields: (t) => ({
		id: t.exposeString("id"),
		title: t.exposeString("title"),
		description: t.exposeString("description"),
		minimumPrice: t.exposeInt("minimumPrice"),
		maximumPrice: t.exposeInt("maximumPrice"),
		image: t.exposeString("image"),
		numSpots: t.exposeInt("numSpots"),
		userWaitlistGroup: t.field({
			type: "EventWaitlistGroup",
			nullable: true,
			resolve: async (p, _a, { prisma, currentUser }) => {
				// get the waitlist
				const waitlistGroup = await prisma.eventWaitlistGroup.findFirst({
					where: {
						eventWaitlist: {
							eventId: p.id,
						},
						users: {
							some: {
								id: currentUser?.id,
							},
						},
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
										eventOrderedStops: {
											some: {
												eventId: p.id,
											},
										},
									},
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
			type: ["EventProduct"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventProduct.findMany({
					where: {
						eventId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		addOns: t.field({
			type: ["EventAddOn"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventAddOn.findMany({
					where: {
						eventId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		stops: t.field({
			type: ["EventOrderedStop"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventOrderedStop.findMany({
					where: {
						eventId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				}),
		}),
		waitlist: t.field({
			type: ["EventWaitlist"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventWaitlist.findMany({
					where: {
						eventId: p.id,
					},
				}),
		}),
	}),
})

builder.queryFields((t) => ({
	events: t.field({
		type: ["Event"],
		resolve: (_root, _a, { prisma }) =>
			prisma.event.findMany({
				orderBy: {
					waitlist: {
						groups: {
							_count: "desc",
						},
					},
				},
			}),
	}),
	event: t.field({
		type: "Event",
		errors: {
			types: [Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_root, { id }, { prisma }) => {
			const event = await prisma.event.findUnique({
				where: {
					id,
				},
			})
			if (!event) {
				throw new Error("Event not found")
			}
			return event
		},
	}),
}))

const CreateEventInput = builder.inputType("CreateEventInput", {
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
			type: [CreateEventOrderedStopInput],
			required: true,
		}),
		products: t.field({
			type: [CreateEventProductInput],
			required: true,
		}),
		addOns: t.field({
			type: [CreateEventAddOnInput],
		}),
	}),
})

builder.mutationFields((t) => ({
	createEvent: t.field({
		type: "Event",
		args: {
			input: t.arg({ type: CreateEventInput, required: true }),
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
			// create event
			return prisma.$transaction(async (tx) => {
				// get location ids from stops in order
				const locationIds = input.stops.map((stop) => stop.locationId)

				for (const [i, location] of locationIds.entries()) {
					// get next location
					const nextLocation = locationIds[i + 1]
					if (!nextLocation) break
					await generateTravelBetweenLocations(tx, location, nextLocation)
				}

				return tx.event.create({
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
								minimumPrice: addOn.minimumPrice,
								maximumPrice: addOn.maximumPrice,
								image: addOn.image,
							})),
						},
					},
				})
			})
		},
	}),
}))
