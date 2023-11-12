import { builder } from "../../builder"

builder.objectType("Country", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		initials: t.exposeString("initials"),
	}),
})
