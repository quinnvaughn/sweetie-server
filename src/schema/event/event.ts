import { DateTime } from "luxon"
import { builder } from "../../builder"
import { CreateEventOrderedStopInput } from "./ordered-stop"
import { CreateEventProviderInput } from "./provider"

builder.objectType("Event", {
	fields: (t) => ({
		id: t.exposeString("id"),
		title: t.exposeString("title"),
		description: t.exposeString("description"),
		numSpots: t.exposeInt("numSpots"),
		image: t.exposeString("image"),
		isAvailableForPuchase: t.field({
			type: "Boolean",
			resolve: async (p) => {
				// Two days before the start date, it's now available for purchase
				const now = DateTime.now()
				// We are just getting the beginning of the day
				// and then subtracting two days from it
				const startDate = DateTime.fromJSDate(p.startDate).startOf("day")
				const twoDaysBefore = startDate.minus({ days: 2 })
				return now > twoDaysBefore
			},
		}),
		startDate: t.field({
			type: "DateTime",
			nullable: false,
			resolve: (root) => root.startDate,
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
		orderedStops: t.field({
			type: ["EventOrderedStop"],
			resolve: async (p, _a, { prisma }) => {
				const stops = await prisma.eventOrderedStop.findMany({
					where: {
						eventId: p.id,
					},
				})
				return stops
			},
		}),
		providers: t.field({
			type: ["EventProvider"],
			resolve: async (p, _a, { prisma }) => {
				const providers = await prisma.eventProvider.findMany({
					where: {
						eventId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				})
				return providers
			},
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
		resolve: async (_root, _args, { prisma }) => {
			const events = await prisma.event.findMany({
				orderBy: {
					startDate: "asc",
				},
			})
			return events
		},
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
		numSpots: t.int({ required: true }),
		image: t.string({ required: true }),
		startDate: t.string({ required: true }),
		// will need this as they aren't personally creating this,
		// I am. so i need to know who to attribute it to.
		userId: t.string({ required: true }),
		// stops
		orderedStops: t.field({
			type: [CreateEventOrderedStopInput],
			required: true,
		}),
		// providers
		providers: t.field({
			type: [CreateEventProviderInput],
			required: true,
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
			// check if it's valid and make sure it's in the future
			const startDate = DateTime.fromISO(input.startDate)
			if (!startDate.isValid) {
				throw new Error("Invalid start date")
			}
			if (startDate < DateTime.now()) {
				throw new Error("Start date must be in the future")
			}
			// make sure the tastemaker exists
			const tastemaker = await prisma.tastemaker.findUnique({
				where: {
					userId: input.userId,
				},
			})
			if (!tastemaker) {
				throw new Error("Tastemaker not found")
			}
			const event = await prisma.event.create({
				data: {
					title: input.title,
					description: input.description,
					numSpots: input.numSpots,
					image: input.image,
					startDate: input.startDate,
					tastemakerId: tastemaker.id,
					waitlist: {
						create: {
							// this is the default waitlist
							// it's empty to start
						},
					},
					orderedStops: {
						create: input.orderedStops.map((stop) => ({
							title: stop.title,
							order: stop.order,
							content: stop.content,
							startTimeRange: stop.startTimeRange,
							locationId: stop.locationId,
							buffers: {
								create: stop.buffers.map((buffer) => ({
									name: buffer.name,
									price: buffer.price,
									description: buffer.description,
									image: buffer.image,
								})),
							},
						})),
					},
					providers: {
						create: input.providers.map((provider) => ({
							name: provider.name,
							order: provider.order,
							products: {
								create: provider.products.map((product) => ({
									name: product.name,
									order: product.order,
									description: product.description,
									required: product.required,
									options: {
										create: product.options.map((option) => ({
											name: option.name,
											price: option.price,
											description: option.description,
											hasGratuity: option.hasGratuity,
											image: option.image,
										})),
									},
								})),
							},
						})),
					},
				},
			})
			return event
		},
	}),
}))
