import { builder } from "../../../builder"

export const CustomDateMessageLabel = "CUSTOM_DATE_MESSAGE_EVENT"

export enum CustomDateMessageType {
	NewMessage = "NewMessage",
}

export const CustomDateMessageTypeGql = builder.enumType(
	CustomDateMessageType,
	{
		name: "CustomDateMessageType",
	},
)

export class BaseCustomDateMessageEvent {
	eventType: CustomDateMessageType

	constructor(eventType: CustomDateMessageType) {
		this.eventType = eventType
	}
}

export const IBaseCustomDateMessageEvent = builder.interfaceType(
	BaseCustomDateMessageEvent,
	{
		name: "IBaseCustomDateMessageEvent",
		fields: (t) => ({
			eventType: t.field({
				type: CustomDateMessageTypeGql,
				resolve: (p) => p.eventType,
			}),
		}),
	},
)
