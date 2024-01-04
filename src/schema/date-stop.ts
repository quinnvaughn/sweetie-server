import { builder } from "../builder"

builder.objectType("DateStop", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		content: t.exposeString("content"),
		order: t.exposeInt("order"),
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
			type: "Travel",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				return await prisma.travel.findFirst({
					where: { destinationId: p.id },
				})
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
		estimatedTime: t.int(),
	}),
})
