import { builder } from "../builder"

builder.objectType("TimeOfDay", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
	}),
})
