import { builder } from "../../builder"
import { CreateEventBufferInput } from "./buffer"

builder.objectType("EventOrderedStop", {
	fields: (t) => ({
		id: t.exposeString("id"),
		title: t.exposeString("title"),
		order: t.exposeInt("order"),
		content: t.exposeString("content"),
		startTimeRange: t.field({
			type: ["DateTime"],
			nullable: true,
			resolve: (root) => root.startTimeRange,
		}),
		buffers: t.field({
			type: ["EventBuffer"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventBuffer.findMany({
					where: {
						orderedStopId: p.id,
					},
				}),
		}),
	}),
})

export const CreateEventOrderedStopInput = builder.inputType(
	"CreateEventOrderedStopInput",
	{
		fields: (t) => ({
			title: t.string({ required: true }),
			order: t.int({ required: true }),
			content: t.string({ required: true }),
			startTimeRange: t.field({
				type: ["DateTime"],
				required: true,
			}),
			locationId: t.string({ required: true }),
			buffers: t.field({
				type: [CreateEventBufferInput],
				required: true,
			}),
		}),
	},
)
