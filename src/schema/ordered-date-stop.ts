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
				})
			},
		}),
		numOptions: t.field({
			type: "Int",
			resolve: async (p, _, { prisma }) => {
				return await prisma.dateStopOption.count({
					where: {
						orderedDateStopId: p.id,
					},
				})
			},
		}),
		showOptions: t.field({
			type: "Boolean",
			resolve: async (p, _, { prisma }) => {
				return (
					(await prisma.dateStopOption.count({
						where: {
							orderedDateStopId: p.id,
						},
					})) > 1
				)
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
		hasNextStop: t.field({
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
		hasPreviousStop: t.field({
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
		// We are using the id for filtering purposes.
		// We already have all the options from the parent query.
		// if we did it as the actual options you'd have an infinite loop
		// because if you go to the next option, it would try to resolve the next option
		// and so on.
		nextOptionId: t.field({
			type: "String",
			nullable: true,
			resolve: async (p, _, { prisma }) => {
				const option = await prisma.dateStopOption.findFirst({
					where: {
						orderedDateStopId: p.orderedDateStopId,
						optionOrder: p.optionOrder + 1,
					},
				})
				return option?.id
			},
		}),
		previousOptionId: t.field({
			type: "String",
			nullable: true,
			resolve: async (p, _, { prisma }) => {
				const option = await prisma.dateStopOption.findFirst({
					where: {
						orderedDateStopId: p.orderedDateStopId,
						optionOrder: p.optionOrder - 1,
					},
				})
				return option?.id
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
