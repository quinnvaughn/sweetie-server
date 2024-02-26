import { builder } from "../../builder"

builder.objectType("GroupDateProduct", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		order: t.exposeInt("order"),
		description: t.exposeString("description"),
		image: t.exposeString("image"),
	}),
})

export const CreateGroupDateProductInput = builder.inputType(
	"CreateGroupDateProductInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			order: t.int({ required: true }),
			description: t.string({ required: true }),
			image: t.string({ required: true }),
		}),
	},
)
