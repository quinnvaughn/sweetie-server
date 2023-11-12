import { builder } from "../../builder"

builder.objectType("State", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		initials: t.exposeString("initials"),
	}),
})
