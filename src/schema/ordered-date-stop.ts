import { builder } from "../builder"

builder.objectType("OrderedDateStop", {
	fields: (t) => ({
		id: t.exposeID("id"),
		order: t.exposeInt("order"),
		optional: t.exposeBoolean("optional"),
		estimatedTime: t.exposeInt("estimatedTime"),
		formattedEstimatedTime: t.field({
			type: "String",
			resolve: (p) => {
				const hours = Math.floor(p.estimatedTime / 60)
				const minutes = p.estimatedTime % 60
				if (hours === 0) return `${minutes}min`
				if (minutes === 0) return `${hours}h`
				return `${hours}h ${minutes}min`
			},
		}),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		options: t.field({
			type: ["DateStopOption"],
			resolve: async (p, _, { prisma }) => {
				return await prisma.dateStopOption.findMany({
					where: {
						orderedDateStopId: p.id,
					},
					orderBy: {
						optionOrder: "asc",
					},
				})
			},
		}),
	}),
})

builder.objectType("DateStopOption", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		content: t.exposeString("content"),
		optionOrder: t.exposeInt("optionOrder"),
		location: t.field({
			type: "Location",
			resolve: async (p, _, { prisma }) => {
				const location = await prisma.location.findUnique({
					where: { id: p.locationId },
				})
				if (!location) throw new Error("Location not found")
				return location
			},
		}),
		travel: t.field({
			type: ["Travel"],
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				// get parent ordered date stop
				const parent = await prisma.orderedDateStop.findUnique({
					where: { id: p.orderedDateStopId },
				})
				if (!parent) throw new Error("Parent not found")
				// get all stops with the next stop order
				const nextStops = await prisma.dateStopOption.findMany({
					where: {
						orderedDateStop: {
							freeDateId: parent.freeDateId,
							order: parent.order + 1,
						},
					},
					orderBy: {
						optionOrder: "asc",
					},
				})
				// ie if this is not the last stop
				if (nextStops.length > 0) {
					// we use this to find destinationIds in this array.
					const locationIdMap = nextStops.map((stop) => stop.locationId)
					const travels = await prisma.travel.findMany({
						where: {
							originId: p.locationId,
							destinationId: { in: locationIdMap },
						},
					})
					return travels
				}
				// if this is the last stop, return empty array
				return []
				// we deal with showing the correct travel in the client
				// depending on which order the user is currently on
			},
		}),
		hasNextOption: t.field({
			type: "Boolean",
			resolve: async (p, _, { prisma }) => {
				const nextStop = await prisma.dateStopOption.findFirst({
					where: {
						orderedDateStopId: p.orderedDateStopId,
						optionOrder: p.optionOrder + 1,
					},
				})
				return !!nextStop
			},
		}),
		hasPreviousOption: t.field({
			type: "Boolean",
			resolve: async (p, _, { prisma }) => {
				const previousStop = await prisma.dateStopOption.findFirst({
					where: {
						orderedDateStopId: p.orderedDateStopId,
						optionOrder: p.optionOrder - 1,
					},
				})
				return !!previousStop
			},
		}),
		showOptions: t.field({
			type: "Boolean",
			resolve: async (p, _, { prisma }) => {
				const numOptions = await prisma.dateStopOption.count({
					where: {
						orderedDateStopId: p.orderedDateStopId,
					},
				})
				return numOptions > 1
			},
		}),
	}),
})

export const CreateOrderedDateStopInput = builder.inputType(
	"CreateOrderedDateStopInput",
	{
		fields: (t) => ({
			order: t.int({ required: true }),
			estimatedTime: t.int({ required: true }),
			optional: t.boolean({ required: true }),
			options: t.field({
				type: [DateStopOptionInput],
				required: true,
			}),
		}),
	},
)

export const DateStopOptionInput = builder.inputType("DateStopOptionInput", {
	fields: (t) => ({
		title: t.string({ required: true }),
		content: t.string({ required: true }),
		optionOrder: t.int({ required: true }),
		location: t.field({ type: DateStopOptionLocationInput, required: true }),
	}),
})

export const DateStopOptionLocationInput = builder.inputType(
	"DateStopOptionLocationInput",
	{
		fields: (t) => ({
			id: t.string({ required: true }),
			name: t.string({ required: true }),
		}),
	},
)

export const UpdateOrderedDateStopInput = builder.inputType(
	"UpdateOrderedDateStopInput",
	{
		fields: (t) => ({
			optional: t.boolean(),
			id: t.string(),
			order: t.int(),
			estimatedTime: t.int(),
		}),
	},
)
