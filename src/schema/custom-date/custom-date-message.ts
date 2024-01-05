import * as Sentry from "@sentry/node"
import { builder } from "../../builder"
import { customMessageSentEmail } from "../../lib"
import { emailQueue } from "../../lib/queue"
import { AuthError, FieldErrors } from "../error"
import { NewCustomDateMessageEvent } from "../subscription/custom-date-message"
import { publishCustomDateMessageEvent } from "../subscription/custom-date-message/subscription"

builder.objectType("CustomDateMessage", {
	fields: (t) => ({
		id: t.exposeID("id"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		sender: t.field({
			type: "User",
			resolve: (p, _, { prisma }) =>
				prisma.user.findUniqueOrThrow({
					where: {
						id: p.senderId,
					},
				}),
		}),
		text: t.exposeString("text"),
		customDate: t.field({
			type: "CustomDate",
			resolve: (p, _, { prisma }) =>
				prisma.customDate.findUniqueOrThrow({
					where: {
						id: p.customDateId,
					},
				}),
		}),
	}),
})

const SendCustomDateMessageInput = builder.inputType(
	"SendCustomDateMessageInput",
	{
		fields: (t) => ({
			customDateId: t.string({ required: true }),
			text: t.string({ required: true }),
		}),
	},
)

builder.mutationFields((t) => ({
	sendCustomDateMessage: t.field({
		type: "CustomDateMessage",
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({ type: SendCustomDateMessageInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser, prisma, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to send a message")
			}

			const customDate = await prisma.customDate.findUnique({
				where: {
					id: input.customDateId,
				},
				include: {
					tastemaker: {
						select: {
							user: {
								select: {
									id: true,
									email: true,
								},
							},
						},
					},
					requestor: {
						select: {
							email: true,
						},
					},
				},
			})

			if (!customDate) {
				throw new Error("Custom date not found")
			}

			if (
				customDate.requestorId !== currentUser.id &&
				customDate.tastemaker.user.id !== currentUser.id
			) {
				throw new AuthError(
					"You do not have permission to send a message for this custom date",
				)
			}
			try {
				return await prisma.$transaction(async (tx) => {
					const message = await tx.customDateMessage.create({
						data: {
							customDateId: input.customDateId,
							senderId: currentUser.id,
							text: input.text,
						},
					})
					await emailQueue.add(
						"email",
						customMessageSentEmail({
							to:
								currentUser.email === customDate.requestor.email
									? customDate.tastemaker.user.email
									: customDate.requestor.email,
							from: currentUser.name,
							// we're sending it to the other person, so it's the reverse logic.
							isTastemaker: !(currentUser.id === customDate.tastemaker.user.id),
							customDateId: customDate.id,
						}),
					)
					await publishCustomDateMessageEvent(
						new NewCustomDateMessageEvent(message),
						pubsub,
					)
					await tx.customDate.update({
						where: {
							id: input.customDateId,
						},
						data: {
							lastMessageSentAt: message.createdAt,
						},
					})
					return message
				})
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Error sending message")
			}
		},
	}),
}))
