import { builder } from "../../../builder"
import { Context } from "../../../context"
import {
	BaseCustomDateMessageEvent,
	CustomDateMessageLabel,
	CustomDateMessageType,
	IBaseCustomDateMessageEvent,
} from "./event"
import { NewCustomDateMessageEvent } from "./new-custom-date-message"
import { withFilter } from "graphql-subscriptions"
import { match } from "ts-pattern"

builder.subscriptionField("customDateMessage", (t) => {
	return t.field({
		type: IBaseCustomDateMessageEvent,
		description: "Events related to a custom date message",
		subscribe: (_, _a, ctx, _info) => {
			const subscriptionResolver =
				generateCustomDateMessageEventSubscriptionResolver(ctx)
			return subscriptionResolver(
				_,
				_a,
				ctx,
				_info,
				// rome-ignore lint/suspicious/noExplicitAny: <explanation>
			) as any as AsyncIterable<unknown>
		},
		resolve: async (payload) => {
			return payload as BaseCustomDateMessageEvent
		},
	})
})

function generateCustomDateMessageEventSubscriptionResolver(ctx: Context) {
	return withFilter(
		() => {
			return ctx.pubsub.asyncIterator(CustomDateMessageLabel)
		},
		async (
			event: BaseCustomDateMessageEvent,
			_a,
			{ prisma, currentUser }: Context,
		) => {
			if (!currentUser) {
				return false
			}
			return match(event)
				.with(
					{ eventType: CustomDateMessageType.NewMessage },
					async (event: NewCustomDateMessageEvent) => {
						const customDate = await prisma.customDate.findUnique({
							where: {
								id: event.message.customDateId,
							},
							include: {
								requestor: {
									select: {
										id: true,
									},
								},
								tastemaker: {
									select: {
										userId: true,
									},
								},
							},
						})
						if (!customDate) {
							return false
						}
						return (
							currentUser.id === customDate.requestor.id ||
							currentUser.id === customDate.tastemaker.userId
						)
					},
				)
				.exhaustive()
		},
	)
}

export async function publishCustomDateMessageEvent(
	event: BaseCustomDateMessageEvent,
	pubsub: Context["pubsub"],
) {
	await pubsub.publish(CustomDateMessageLabel, event)
}
