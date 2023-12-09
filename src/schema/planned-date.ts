import { builder } from "../builder"

builder.objectType("PlannedDate", {
	fields: (t) => ({
		id: t.exposeID("id"),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		plannedTime: t.field({
			type: "DateTime",
			resolve: async (p) => new Date(p.plannedTime),
		}),
		user: t.field({
			type: "User",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				if (!p.userId) return null
				return await prisma.user.findUniqueOrThrow({ where: { id: p.userId } })
			},
		}),
		freeDate: t.field({
			type: "FreeDate",
			resolve: async (p, _a, { prisma }) =>
				await prisma.freeDate.findUniqueOrThrow({
					where: { id: p.freeDateId },
				}),
		}),
		email: t.exposeString("email", { nullable: true }),
	}),
})
