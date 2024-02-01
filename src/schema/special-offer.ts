import { builder } from "../builder"

builder.objectType("SpecialOffer", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		color: t.exposeString("color"),
		icon: t.exposeString("icon"),
		description: t.exposeString("description"),
	}),
})

builder.queryFields((t) => ({
	getSpecialOffer: t.field({
		type: "SpecialOffer",
		nullable: true,
		resolve: async (_p, _a, { prisma }) => {
			// find the latest special offer
			return prisma.specialOffer.findFirst({
				orderBy: {
					createdAt: "desc",
				},
			})
		},
	}),
}))
