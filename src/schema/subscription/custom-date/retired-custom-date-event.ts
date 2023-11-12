import { builder } from "../../../builder"
import {
	BaseCustomDateEvent,
	CustomDateType,
	IBaseCustomDateEvent,
} from "./event"
import { CustomDate } from "@prisma/client"

export class ExpiredCustomDateEvent extends BaseCustomDateEvent {
	constructor(date: CustomDate) {
		super(CustomDateType.Expired, date)
	}
}

builder.objectType(ExpiredCustomDateEvent, {
	name: "ExpiredCustomDateEvent",
	description: "When a custom date expires or is declined",
	interfaces: [IBaseCustomDateEvent],
	isTypeOf: (value) => {
		return (
			(value as ExpiredCustomDateEvent).eventType === CustomDateType.Expired
		)
	},
})
