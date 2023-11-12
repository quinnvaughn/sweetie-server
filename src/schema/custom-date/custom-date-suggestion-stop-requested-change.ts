import { builder } from "../../builder"

builder.objectType("CustomDateSuggestionStopRequestedChange", {
	fields: (t) => ({
		id: t.exposeID("id"),
		comment: t.exposeString("comment", { nullable: true }),
		stop: t.field({
			type: "CustomDateSuggestionStop",
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestionStop.findUniqueOrThrow({
					where: {
						id: p.stopId,
					},
				}),
		}),
	}),
})
