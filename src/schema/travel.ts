import { TravelMode } from "@prisma/client"
import { builder } from "../builder"

builder.objectType("Travel", {
	fields: (t) => ({
		id: t.exposeString("id"),
		duration: t.int({
			resolve: async (p, _a, { prisma }) => {
				const travel = await prisma.travel.findUniqueOrThrow({
					where: { id: p.id },
					include: {
						duration: true,
					},
				})
				return travel.duration?.value ?? 0
			},
		}),
		distance: t.int({
			resolve: async (p, _a, { prisma }) => {
				const travel = await prisma.travel.findUniqueOrThrow({
					where: { id: p.id },
					include: {
						distance: true,
					},
				})
				return travel.distance?.value ?? 0
			},
		}),
		mode: t.expose("mode", { type: "TravelMode" }),
	}),
})

builder.enumType(TravelMode, {
	name: "TravelMode",
})
