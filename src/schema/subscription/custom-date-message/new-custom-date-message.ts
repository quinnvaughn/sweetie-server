import { builder } from "../../../builder"
import {
	BaseCustomDateMessageEvent,
	CustomDateMessageType,
	IBaseCustomDateMessageEvent,
} from "./event"
import { CustomDateMessage } from "@prisma/client"

export class NewCustomDateMessageEvent extends BaseCustomDateMessageEvent {
	message: CustomDateMessage

	constructor(message: CustomDateMessage) {
		super(CustomDateMessageType.NewMessage)

		this.message = message
	}
}

builder.objectType(NewCustomDateMessageEvent, {
	name: "NewCustomDateMessageEvent",
	description: "When a new custom date message is created",
	interfaces: [IBaseCustomDateMessageEvent],
	isTypeOf: (value) => {
		// This is the recommended approach to type things in isTypeOf
		// https://github.com/hayes/pothos/issues/336
		return (
			(value as NewCustomDateMessageEvent).eventType ===
			CustomDateMessageType.NewMessage
		)
	},
	fields: (t) => ({
		message: t.field({
			type: "CustomDateMessage",
			resolve: (p) => p.message,
		}),
	}),
})
