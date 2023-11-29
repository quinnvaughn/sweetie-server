import { builder } from "../builder"
import { track } from "../lib"

const TrackInput = builder.inputType("TrackInput", {
	fields: (t) => ({
		event: t.string({ required: true }),
		properties: t.field({ type: "JSON" }),
	}),
})

builder.mutationFields((t) => ({
	track: t.field({
		type: "Boolean",
		args: {
			input: t.arg({ type: TrackInput, required: true }),
		},
		resolve: async (_p, { input }, { req }) => {
			track(req, input.event, input.properties)
			return true
		},
	}),
}))
