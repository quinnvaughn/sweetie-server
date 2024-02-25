import { builder } from "../../builder"

builder.objectType("EventProduct", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		order: t.exposeInt("order"),
		description: t.exposeString("description"),
		image: t.exposeString("image", { nullable: true }),
	}),
})

export const CreateEventProductInput = builder.inputType(
	"CreateEventProductInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			order: t.int({ required: true }),
			description: t.string({ required: true }),
			image: t.string({ required: true }),
		}),
	},
)
