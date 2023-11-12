import { builder } from "../../../builder"
import { Context } from "../../../context"
import {
	BaseCustomDateSuggestionEvent,
	CustomDateSuggestionLabel,
	CustomDateSuggestionType,
	IBaseCustomDateSuggestionEvent,
} from "./event"
import { NewCustomDateSuggestionEvent } from "./new-custom-date-suggestion"
import { withFilter } from "graphql-subscriptions"
import { match } from "ts-pattern"

builder.subscriptionField("customDateSuggestion", (t) => {
	return t.field({
		type: IBaseCustomDateSuggestionEvent,
		description: "Events related to a custom date suggestion",
		subscribe: (_, _a, ctx, _info) => {
			const subscriptionResolver =
				generateCustomDateSuggestionEventSubscriptionResolver(ctx)
			return subscriptionResolver(
				_,
				_a,
				ctx,
				_info,
				// rome-ignore lint/suspicious/noExplicitAny: <explanation>
			) as any as AsyncIterable<unknown>
		},
		resolve: async (payload) => {
			return payload as BaseCustomDateSuggestionEvent
		},
	})
})

function generateCustomDateSuggestionEventSubscriptionResolver(ctx: Context) {
	return withFilter(
		() => {
			return ctx.pubsub.asyncIterator(CustomDateSuggestionLabel)
		},
		async (
			event: BaseCustomDateSuggestionEvent,
			_a,
			{ prisma, currentUser }: Context,
		) => {
			if (!currentUser) {
				return false
			}
			return match(event)
				.with(
					{ eventType: CustomDateSuggestionType.NewSuggestion },
					// we want to do the same thing on refund requested
					// we just want to remove it from the list of custom dates
					// on the client side, so we need a different event type.
					{ eventType: CustomDateSuggestionType.RefundRequested },
					async (event) => {
						const typedEvent = event as NewCustomDateSuggestionEvent
						const customDate = await prisma.customDate.findUnique({
							where: {
								id: typedEvent.suggestion.customDateId,
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

export async function publishCustomDateSuggestionEvent(
	event: BaseCustomDateSuggestionEvent,
	pubsub: Context["pubsub"],
) {
	await pubsub.publish(CustomDateSuggestionLabel, event)
}
