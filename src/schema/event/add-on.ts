import { builder } from "../../builder"

builder.objectType("EventAddOn", {
	fields: (t) => ({
		id: t.exposeString("id"),
		name: t.exposeString("name"),
		order: t.exposeInt("order"),
		image: t.exposeString("image", { nullable: true }),
		minimumPrice: t.exposeInt("minimumPrice"),
		maximumPrice: t.exposeInt("maximumPrice"),
		description: t.exposeString("description"),
	}),
})

export const CreateEventAddOnInput = builder.inputType(
	"CreateEventAddOnInput",
	{
		fields: (t) => ({
			name: t.string({ required: true }),
			order: t.int({ required: true }),
			description: t.string({ required: true }),
			minimumPrice: t.int({ required: true }),
			maximumPrice: t.int({ required: true }),
			image: t.string({ required: false }),
		}),
	},
)
