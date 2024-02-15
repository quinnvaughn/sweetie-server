import { builder } from "../../builder"
import { CreateEventProductInput } from "./product"

builder.objectType("EventProvider", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		order: t.exposeInt("order"),
		products: t.field({
			type: ["EventProduct"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventProduct.findMany({
					where: {
						providerId: p.id,
					},
				}),
		}),
	}),
})

export const CreateEventProviderInput = builder.inputType(
	"CreateEventProviderInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			order: t.int({ required: true }),
			products: t.field({
				type: [CreateEventProductInput],
				required: true,
			}),
		}),
	},
)
