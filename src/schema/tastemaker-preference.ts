import { builder } from "../builder"

builder.objectType("TastemakerPreference", {
	fields: (t) => ({
		id: t.exposeID("id"),
		cities: t.field({
			type: ["City"],
			resolve: async (p, _, { prisma }) => {
				return await prisma.city.findMany({
					where: {
						tastemakerPreferences: {
							some: {
								id: p.id,
							},
						},
					},
				})
			},
		}),
		tags: t.field({
			type: ["Tag"],
			resolve: async (p, _, { prisma }) => {
				return await prisma.tag.findMany({
					where: {
						tastemakerPreferences: {
							some: {
								id: p.id,
							},
						},
					},
				})
			},
		}),
	}),
})
