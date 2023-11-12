import { builder } from "../../../builder"
import { CustomDate } from "@prisma/client"

export const CustomDateLabel = "CUSTOM_DATE_EVENT"

export enum CustomDateType {
	New = "New",
	Accepted = "Accepted",
	Expired = "Expired",
	Declined = "Declined",
}

export const CustomDateTypeGql = builder.enumType(CustomDateType, {
	name: "CustomDateType",
})

export class BaseCustomDateEvent {
	eventType: CustomDateType
	date: CustomDate

	constructor(eventType: CustomDateType, date: CustomDate) {
		this.eventType = eventType
		this.date = date
	}
}

export const IBaseCustomDateEvent = builder.interfaceType(BaseCustomDateEvent, {
	name: "IBaseCustomDateEvent",
	fields: (t) => ({
		eventType: t.field({
			type: CustomDateTypeGql,
			resolve: (p) => p.eventType,
		}),
		date: t.field({
			type: "CustomDate",
			resolve: (p) => p.date,
		}),
	}),
})
