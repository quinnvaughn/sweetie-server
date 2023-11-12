import { builder } from "../../builder"

builder.objectType("CustomDateSuggestionStatus", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		suggestions: t.field({
			type: ["CustomDateSuggestion"],
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestion.findMany({
					where: {
						statusId: p.id,
					},
				}),
		}),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
	}),
})
