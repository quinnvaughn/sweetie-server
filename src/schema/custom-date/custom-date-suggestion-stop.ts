import { builder } from "../../builder"

builder.objectType("CustomDateSuggestionStop", {
	fields: (t) => ({
		id: t.exposeID("id"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		order: t.exposeInt("order"),
		content: t.exposeString("content"),
		suggestion: t.field({
			type: "CustomDateSuggestion",
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestion.findUniqueOrThrow({
					where: {
						id: p.suggestionId,
					},
				}),
		}),
		location: t.field({
			type: "Location",
			resolve: (p, _, { prisma }) =>
				prisma.location.findUniqueOrThrow({
					where: {
						id: p.locationId,
					},
				}),
		}),
		change: t.field({
			type: "CustomDateSuggestionStopRequestedChange",
			nullable: true,
			resolve: (p, _, { prisma }) =>
				prisma.customDateSuggestionStopRequestedChange.findUnique({
					where: {
						stopId: p.id,
					},
				}),
		}),
	}),
})
