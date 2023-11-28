import { builder } from "../builder"

builder.objectType("FreeDateViews", {
	fields: (t) => ({
		id: t.exposeID("id"),
		freeDate: t.field({
			type: "FreeDate",
			nullable: false,
			resolve: (parent, _, { prisma }) => {
				return prisma.freeDate.findUniqueOrThrow({
					where: { id: parent.freeDateId },
				})
			},
		}),
		lastViewedAt: t.field({
			type: "DateTime",
			resolve: (p) => p.lastViewedAt,
			nullable: true,
		}),
		viewCount: t.int({
			resolve: (p) => p.views,
		}),
	}),
})
