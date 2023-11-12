import { builder } from "../../../builder"

export const CustomDateSuggestionLabel = "CUSTOM_DATE_SUGGESTION_EVENT"

export enum CustomDateSuggestionType {
	NewSuggestion = "NewSuggestion",
	RefundRequested = "RefundRequested",
}

export const CustomDateSuggestionTypeGql = builder.enumType(
	CustomDateSuggestionType,
	{
		name: "CustomDateSuggestionType",
	},
)

export class BaseCustomDateSuggestionEvent {
	eventType: CustomDateSuggestionType

	constructor(eventType: CustomDateSuggestionType) {
		this.eventType = eventType
	}
}

export const IBaseCustomDateSuggestionEvent = builder.interfaceType(
	BaseCustomDateSuggestionEvent,
	{
		name: "IBaseCustomDateSuggestionEvent",
		fields: (t) => ({
			eventType: t.field({
				type: CustomDateSuggestionTypeGql,
				resolve: (p) => p.eventType,
			}),
		}),
	},
)
