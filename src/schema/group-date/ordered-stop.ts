import { builder } from "../../builder"

builder.objectType("GroupDateOrderedStop", {
	fields: (t) => ({
		id: t.exposeString("id"),
		order: t.exposeInt("order"),
		description: t.exposeString("description"),
		estimatedTime: t.exposeInt("estimatedTime"),
		estimatedTimeHoursMinutes: t.field({
			type: "String",
			resolve: (p) => {
				// convert to hh:mm
				// currently is in minutes
				// add leading zero if minutes is less than 10
				const hours = Math.floor(p.estimatedTime / 60)
				const minutes = p.estimatedTime % 60
				const minutesString = minutes < 10 ? `0${minutes}` : `${minutes}`
				return `${hours}:${minutesString}`
			},
		}),
		formattedEstimatedTime: t.field({
			type: "String",
			resolve: (p) => {
				const hours = Math.floor(p.estimatedTime / 60)
				const minutes = p.estimatedTime % 60
				if (hours === 0) return `${minutes}min`
				if (minutes === 0) return `${hours}h`
				return `${hours}h ${minutes}min`
			},
		}),
		travel: t.field({
			type: "Travel",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				// get the current stop's location
				const location = await prisma.location.findUnique({
					where: {
						id: p.locationId,
					},
					select: {
						id: true,
					},
				})
				// get the next stop to find the travel
				const nextStop = await prisma.groupDateOrderedStop.findFirst({
					where: {
						order: {
							equals: p.order + 1,
						},
					},
					orderBy: {
						order: "asc",
					},
					include: {
						location: {
							select: {
								id: true,
							},
						},
					},
				})
				if (!location || !nextStop) {
					return null
				}
				// get the travel
				return prisma.travel.findUnique({
					where: {
						originId_destinationId: {
							originId: location.id,
							destinationId: nextStop.locationId,
						},
					},
				})
			},
		}),
		location: t.field({
			type: "Location",
			resolve: async (p, _a, { prisma }) => {
				const location = await prisma.location.findUnique({
					where: {
						id: p.locationId,
					},
				})
				if (!location) {
					throw new Error("Location not found")
				}
				return location
			},
		}),
	}),
})

export const CreateGroupDateOrderedStopInput = builder.inputType(
	"CreateGroupDateOrderedStopInput",
	{
		fields: (t) => ({
			description: t.string({ required: true }),
			order: t.int({ required: true }),
			locationId: t.string({ required: true }),
		}),
	},
)
