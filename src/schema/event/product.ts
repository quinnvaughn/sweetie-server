import { builder } from "../../builder"

builder.objectType("EventProduct", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		order: t.exposeInt("order"),
		description: t.exposeString("description"),
		required: t.exposeBoolean("required"),
		provider: t.field({
			type: "EventProvider",
			resolve: async (p, _a, { prisma }) => {
				const provider = await prisma.eventProvider.findUnique({
					where: {
						id: p.providerId,
					},
				})
				if (!provider) {
					throw new Error("Provider not found")
				}
				return provider
			},
		}),
		options: t.field({
			type: ["EventProductOption"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventProductOption.findMany({
					where: {
						eventProductId: p.id,
					},
				}),
		}),
	}),
})

builder.objectType("EventProductOption", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		price: t.exposeInt("price"),
		description: t.exposeString("description"),
		hasGratuity: t.exposeBoolean("hasGratuity"),
		image: t.exposeString("image", { nullable: true }),
		product: t.field({
			type: "EventProduct",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				if (!p.eventProductId) return null
				return await prisma.eventProduct.findUnique({
					where: {
						id: p.eventProductId,
					},
				})
			},
		}),
		purchases: t.field({
			type: ["EventPurchase"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventPurchase.findMany({
					where: {
						optionId: p.id,
					},
				}),
		}),
	}),
})

export const CreateEventProductInput = builder.inputType(
	"CreateEventProductInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			order: t.int({ required: true }),
			description: t.string({ required: true }),
			required: t.boolean({ required: true }),
			options: t.field({
				type: [CreateEventProductOptionInput],
				required: true,
			}),
		}),
	},
)

export const CreateEventProductOptionInput = builder.inputType(
	"CreateEventProductOptionInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			price: t.int({ required: true }),
			description: t.string({ required: true }),
			hasGratuity: t.boolean({ required: true }),
			image: t.string({ required: false }),
		}),
	},
)
