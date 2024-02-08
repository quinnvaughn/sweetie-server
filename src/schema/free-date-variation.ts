import { builder } from "../builder"

builder.objectType("FreeDateVariation", {
	fields: (t) => ({
		id: t.exposeString("id"),
		freeDate: t.field({
			type: "FreeDate",
			resolve: async (parent, _args, { prisma }) => {
				const freeDate = await prisma.freeDate.findUnique({
					where: { id: parent.id },
				})
				if (!freeDate) {
					throw new Error("Free Date not found")
				}
				return freeDate
			},
		}),
		plannedDates: t.field({
			type: ["PlannedDate"],
			resolve: async (parent, _args, { prisma }) =>
				prisma.plannedDate.findMany({
					where: { freeDateVariationId: parent.id },
				}),
		}),
		stops: t.field({
			type: ["DateStopOption"],
			resolve: async (parent, _args, { prisma }) =>
				prisma.dateStopOption.findMany({
					where: { freeDateVariations: { some: { id: parent.id } } },
					orderBy: [
						{
							orderedDateStop: {
								order: "asc",
							},
						},
						{
							optionOrder: "asc",
						},
					],
				}),
		}),
	}),
})
