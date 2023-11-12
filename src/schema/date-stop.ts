import { builder } from "../builder"

builder.objectType("DateStop", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		content: t.exposeString("content"),
		order: t.exposeInt("order"),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		location: t.field({
			type: "Location",
			resolve: async (p, _a, { prisma }) =>
				await prisma.location.findUniqueOrThrow({
					where: { id: p.locationId },
				}),
		}),
	}),
})

export const CreateDateStopInput = builder.inputType("CreateDateStopInput", {
	fields: (t) => ({
		title: t.string({ required: true }),
		content: t.string({ required: true }),
		locationId: t.string({ required: true }),
		order: t.int({ required: true }),
	}),
})

export const UpdateDateStopInput = builder.inputType("UpdateDateStopInput", {
	fields: (t) => ({
		title: t.string(),
		content: t.string(),
		locationId: t.string(),
		order: t.int(),
	}),
})
