import { builder } from "../../builder"

builder.objectType("EventBuffer", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		price: t.exposeInt("price"),
		description: t.exposeString("description"),
		image: t.exposeString("image", { nullable: true }),
	}),
})

export const CreateEventBufferInput = builder.inputType(
	"CreateEventBufferInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			price: t.int({ required: true }),
			description: t.string({ required: true }),
			image: t.string({ required: false }),
		}),
	},
)
