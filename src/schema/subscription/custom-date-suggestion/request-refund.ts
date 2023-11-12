import { builder } from "../../../builder"
import {
	BaseCustomDateSuggestionEvent,
	CustomDateSuggestionType,
	IBaseCustomDateSuggestionEvent,
} from "./event"
import { CustomDateSuggestion } from "@prisma/client"

export class RequestRefundEvent extends BaseCustomDateSuggestionEvent {
	suggestion: CustomDateSuggestion

	constructor(suggestion: CustomDateSuggestion) {
		super(CustomDateSuggestionType.RefundRequested)

		this.suggestion = suggestion
	}
}

builder.objectType(RequestRefundEvent, {
	name: "RequestRefundEvent",
	description: "When a new custom date suggestion is created or updated",
	interfaces: [IBaseCustomDateSuggestionEvent],
	isTypeOf: (value) => {
		// This is the recommended approach to type things in isTypeOf
		// https://github.com/hayes/pothos/issues/336
		return (
			(value as RequestRefundEvent).eventType ===
			CustomDateSuggestionType.RefundRequested
		)
	},
	fields: (t) => ({
		suggestion: t.field({
			type: "CustomDateSuggestion",
			resolve: (p) => p.suggestion,
		}),
	}),
})
