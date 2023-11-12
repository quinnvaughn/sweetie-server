import { builder } from "../../../builder"
import {
	BaseCustomDateEvent,
	CustomDateType,
	IBaseCustomDateEvent,
} from "./event"
import { CustomDate } from "@prisma/client"

export class NewCustomDateEvent extends BaseCustomDateEvent {
	constructor(date: CustomDate) {
		super(CustomDateType.New, date)
	}
}

builder.objectType(NewCustomDateEvent, {
	name: "NewCustomDateEvent",
	description: "When a new custom date is created",
	interfaces: [IBaseCustomDateEvent],
	isTypeOf: (value) => {
		// This is the recommended approach to type things in isTypeOf
		// https://github.com/hayes/pothos/issues/336
		return (value as NewCustomDateEvent).eventType === CustomDateType.New
	},
})
