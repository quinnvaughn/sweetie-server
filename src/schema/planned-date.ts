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
			resolve: async (p, _a, { prisma }) =>
				await prisma.user.findUniqueOrThrow({ where: { id: p.userId } }),
		}),
		experience: t.field({
			type: "DateExperience",
			resolve: async (p, _a, { prisma }) =>
				await prisma.dateExperience.findUniqueOrThrow({
					where: { id: p.experienceId },
				}),
		}),
	}),
})
