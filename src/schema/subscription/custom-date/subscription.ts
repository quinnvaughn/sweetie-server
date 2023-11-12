import { builder } from "../../../builder"
import { Context } from "../../../context"
import {
	BaseCustomDateEvent,
	CustomDateLabel,
	CustomDateType,
	IBaseCustomDateEvent,
} from "./event"
import { withFilter } from "graphql-subscriptions"
import { match } from "ts-pattern"

builder.subscriptionField("customDate", (t) => {
	return t.field({
		type: IBaseCustomDateEvent,
		description: "Events related to a custom date",
		subscribe: (_, _a, ctx, _info) => {
			const subscriptionResolver =
				generateCustomDateEventSubscriptionResolver(ctx)
			return subscriptionResolver(
				_,
				_a,
				ctx,
				_info,
				// rome-ignore lint/suspicious/noExplicitAny: <explanation>
			) as any as AsyncIterable<unknown>
		},
		resolve: async (payload) => {
			return payload as BaseCustomDateEvent
		},
	})
})

function generateCustomDateEventSubscriptionResolver(ctx: Context) {
	return withFilter(
		() => {
			return ctx.pubsub.asyncIterator(CustomDateLabel)
		},
		async (
			event: BaseCustomDateEvent,
			_a,
			{ prisma, currentUser }: Context,
		) => {
			if (!currentUser) {
				return false
			}
			return match(event)
				.with(
					{ eventType: CustomDateType.New },
					{ eventType: CustomDateType.Accepted },
					{ eventType: CustomDateType.Expired },
					{ eventType: CustomDateType.Declined },
					async (event) => {
						const customDate = await prisma.customDate.findUnique({
							where: {
								id: event.date.id,
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

export async function publishCustomDateEvent(
	event: BaseCustomDateEvent,
	pubsub: Context["pubsub"],
) {
	await pubsub.publish(CustomDateLabel, event)
}
