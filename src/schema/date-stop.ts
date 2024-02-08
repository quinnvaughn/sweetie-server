import { builder } from "../builder"

builder.objectType("DateStop", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		content: t.exposeString("content"),
		order: t.exposeInt("order"),
		optionOrder: t.exposeInt("optionOrder"),
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
		location: t.field({
			type: "Location",
			resolve: async (p, _a, { prisma }) =>
				await prisma.location.findUniqueOrThrow({
					where: { id: p.locationId },
				}),
		}),
		travel: t.field({
			type: ["Travel"],
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				// find all stops with the next stop order
				const nextStops = await prisma.dateStop.findMany({
					where: {
						order: p.order + 1,
					},
					orderBy: { order: "asc" },
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
	}),
})

export const CreateDateStopInput = builder.inputType("CreateDateStopInput", {
	fields: (t) => ({
		title: t.string({ required: true }),
		content: t.string({ required: true }),
		location: t.field({
			type: DateStopLocationInput,
			required: true,
		}),
		order: t.int({ required: true }),
		optionOrder: t.int({ required: true }),
		estimatedTime: t.int({ required: true }),
	}),
})

export const DateStopLocationInput = builder.inputType(
	"DateStopLocationInput",
	{
		fields: (t) => ({
			id: t.string({ required: true }),
			name: t.string({ required: true }),
		}),
	},
)

export const UpdateDateStopInput = builder.inputType("UpdateDateStopInput", {
	fields: (t) => ({
		title: t.string(),
		content: t.string(),
		location: t.field({
			type: DateStopLocationInput,
			required: true,
		}),
		order: t.int(),
		optionOrder: t.int(),
		estimatedTime: t.int(),
	}),
})
