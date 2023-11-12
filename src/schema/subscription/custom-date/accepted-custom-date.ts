import { builder } from "../../../builder"
import {
	BaseCustomDateEvent,
	CustomDateType,
	IBaseCustomDateEvent,
} from "./event"
import { CustomDate } from "@prisma/client"

export class AcceptedCustomDateEvent extends BaseCustomDateEvent {
	constructor(date: CustomDate) {
		super(CustomDateType.Accepted, date)
	}
}

builder.objectType(AcceptedCustomDateEvent, {
	name: "AcceptedCustomDateEvent",
	description: "When a custom date is accepted",
	interfaces: [IBaseCustomDateEvent],
	isTypeOf: (value) => {
		// This is the recommended approach to type things in isTypeOf
		// https://github.com/hayes/pothos/issues/336
		return (
			(value as AcceptedCustomDateEvent).eventType === CustomDateType.Accepted
		)
	},
})
