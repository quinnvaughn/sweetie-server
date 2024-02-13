import { builder } from "../builder"

builder.objectType("Tag", {
	fields: (t) => ({
		id: t.exposeID("id"),
		text: t.exposeString("text"),
		freeDates: t.field({
			type: ["FreeDate"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.freeDate.findMany({
					where: {
						tags: {
							some: {
								id: parent.id,
							},
						},
					},
				})
			},
		}),
		drafts: t.field({
			type: ["FreeDateDraft"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.freeDateDraft.findMany({
					where: {
						tags: {
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
	tags: t.field({
		type: ["Tag"],
		args: {
			text: t.arg.string(),
		},
		resolve: async (_parent, { text }, { prisma }) => {
			return await prisma.tag.findMany({
				where: {
					text: text
						? {
								contains: text,
								mode: "insensitive",
						  }
						: undefined,
				},
				orderBy: {
					text: "asc",
				},
			})
		},
	}),
}))
