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
			resolve: async (p, _a, { prisma, currentUser }) => {
				if (!p.userId) return null
				if (currentUser?.id !== p.userId) return null
				return await prisma.user.findUniqueOrThrow({ where: { id: p.userId } })
			},
		}),
		variation: t.field({
			type: "FreeDateVariation",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				if (!p.freeDateVariationId) return null
				return await prisma.freeDateVariation.findUnique({
					where: { id: p.freeDateVariationId },
				})
			},
		}),
		email: t.exposeString("email", { nullable: true }),
		guest: t.field({
			type: PlannedDateGuest,
			nullable: true,
			resolve: async (p) => {
				if (!p.guestEmail) return null
				return {
					email: p.guestEmail,
					name: p.guestName,
				}
			},
		}),
	}),
})

type PlannedDateGuest = {
	email?: string | null
	name?: string | null
}

export const PlannedDateGuest = builder
	.objectRef<PlannedDateGuest>("PlannedDateGuest")
	.implement({
		fields: (t) => ({
			email: t.exposeString("email", {
				nullable: true,
			}),
			name: t.exposeString("name", {
				nullable: true,
			}),
		}),
	})
