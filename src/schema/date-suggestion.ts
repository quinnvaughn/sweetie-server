import { builder } from "../builder"

builder.objectType("DateSuggestion", {
	fields: (t) => ({
		id: t.exposeID("id"),
		text: t.exposeString("text"),
		cities: t.field({
			type: ["City"],
			resolve: async (parent, _, { prisma }) => {
				return await prisma.city.findMany({
					where: {
						suggestions: {
							some: {
								id: parent.id,
							},
						},
					},
				})
			},
		}),
	}),
})

builder.queryFields((t) => ({
	dateSuggestions: t.field({
		// TODO: Change to a connection
		// Probably will want search eventually
		type: ["DateSuggestion"],
		resolve: async (_p, _a, { prisma }) => {
			return await prisma.dateSuggestion.findMany({
				orderBy: {
					createdAt: "desc",
				},
			})
		},
	}),
}))
