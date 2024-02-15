import { builder } from "../../builder"

builder.objectType("EventPurchase", {
	fields: (t) => ({
		id: t.exposeString("id"),
		quantity: t.exposeInt("quantity"),
		user: t.field({
			type: "User",
			resolve: async (p, _a, { prisma }) => {
				const user = await prisma.user.findUnique({
					where: {
						id: p.userId,
					},
				})
				if (!user) {
					throw new Error("User not found")
				}
				return user
			},
		}),
		option: t.field({
			type: "EventProductOption",
			resolve: async (p, _a, { prisma }) => {
				const product = await prisma.eventProductOption.findUnique({
					where: {
						id: p.userId,
					},
				})
				if (!product) {
					throw new Error("Product not found")
				}
				return product
			},
		}),
	}),
})
