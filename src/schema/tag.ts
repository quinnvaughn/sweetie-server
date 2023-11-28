import { builder } from "../builder"

builder.objectType("Tag", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
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
			name: t.arg.string(),
		},
		resolve: async (_parent, { name }, { prisma }) => {
			return await prisma.tag.findMany({
				where: {
					name: name
						? {
								contains: name,
								mode: "insensitive",
						  }
						: undefined,
				},
				orderBy: {
					name: "asc",
				},
			})
		},
	}),
}))
