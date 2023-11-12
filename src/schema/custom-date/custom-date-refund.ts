import { builder } from "../../builder"
import {
	acceptedRefundEmailForTastemaker,
	acceptedRefundEmailForUser,
	deniedRefundEmailTastemaker,
	deniedRefundEmailUser,
	emailForAdmin,
	emailForTastemaker,
} from "../../lib/email/custom-date-refund"
import { emailQueue } from "../../lib/queue"
import { removePayTastemaker } from "../../lib/queue/custom-date"
import { AuthError } from "../error"
import { publishCustomDateSuggestionEvent } from "../subscription/custom-date-suggestion"
import { RequestRefundEvent } from "../subscription/custom-date-suggestion/request-refund"
import { match } from "ts-pattern"

builder.objectType("CustomDateRefund", {
	fields: (t) => ({
		id: t.exposeID("id"),
		reason: t.exposeString("reason"),
		status: t.field({
			type: "CustomDateRefundStatus",
			resolve: (p, _, { prisma }) =>
				prisma.customDateRefundStatus.findUniqueOrThrow({
					where: {
						id: p.statusId,
					},
				}),
		}),
		date: t.field({
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

const RequestRefundOnCustomDateInput = builder.inputType(
	"RequestRefundOnCustomDateInput",
	{
		fields: (t) => ({
			customDateId: t.string({ required: true }),
			reason: t.string({ required: true }),
		}),
	},
)

const RespondToRequestedRefundInput = builder.inputType(
	"RespondToRequestedRefundInput",
	{
		fields: (t) => ({
			refundId: t.string({ required: true }),
			accepted: t.boolean({ required: true }),
			reason: t.string({ required: true }),
		}),
	},
)

builder.mutationFields((t) => ({
	requestRefundOnCustomDate: t.field({
		type: "CustomDateRefund",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: RequestRefundOnCustomDateInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser, pubsub }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to request a refund")
			}

			const customDate = await prisma.customDate.findUnique({
				where: {
					id: input.customDateId,
				},
				include: {
					refund: true,
					status: {
						select: {
							name: true,
						},
					},
					suggestions: {
						take: 1,
						orderBy: {
							revisionNumber: "desc",
						},
					},
					tastemaker: {
						select: {
							user: {
								select: {
									email: true,
								},
							},
						},
					},
				},
			})
			// make sure custom date exists
			if (!customDate) {
				throw new Error("Custom date not found")
			}
			// make sure user is the requestor
			if (customDate.requestorId !== currentUser.id) {
				throw new Error("You are not the requestor of this custom date")
			}
			// make sure custom date is accepted
			if (customDate.status.name !== "accepted") {
				throw new Error(
					"You cannot request a refund on a custom date that is not accepted",
				)
			}
			// make sure custom date is not already refunded or pending refund
			if (customDate.refund) {
				throw new Error(
					"You have already requested a refund on this custom date",
				)
			}

			const acceptedSuggestionStatus =
				await prisma.customDateSuggestionStatus.findUnique({
					where: {
						name: "accepted",
					},
				})

			if (!acceptedSuggestionStatus) {
				throw new Error("Status not found")
			}

			const mostRecentSuggestion = customDate.suggestions[0]

			if (!mostRecentSuggestion) {
				throw new Error("Custom date has no suggestions")
			}

			if (mostRecentSuggestion.statusId === acceptedSuggestionStatus.id) {
				throw new Error(
					"You cannot request a refund on a custom date that has an accepted suggestion",
				)
			}

			const status = await prisma.customDateRefundStatus.findUnique({
				where: {
					name: "requested",
				},
			})

			if (!status) {
				throw new Error("Status not found")
			}

			try {
				await publishCustomDateSuggestionEvent(
					new RequestRefundEvent(mostRecentSuggestion),
					pubsub,
				)
				const refund = await prisma.customDateRefund.create({
					data: {
						customDateId: customDate.id,
						reason: input.reason,
						statusId: status.id,
					},
				})
				await removePayTastemaker(customDate.id)
				await emailQueue.add(
					"email",
					emailForAdmin({
						requestor: currentUser.email,
						requestId: refund.id,
					}),
				)
				await emailQueue.add(
					"email",
					emailForTastemaker({
						requestor: currentUser.email,
						tastemakerEmail: customDate.tastemaker.user.email,
					}),
				)
				return refund
			} catch {
				throw new Error("Could not create refund request")
			}
		},
	}),
	respondToRequestedRefund: t.field({
		type: "CustomDateRefund",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: RespondToRequestedRefundInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError(
					"You must be logged in to respond to a refund request",
				)
			}

			const adminRole = await prisma.role.findUnique({
				where: {
					name: "admin",
				},
			})

			if (!adminRole) {
				throw new Error("Admin role not found")
			}

			if (currentUser.roleId !== adminRole.id) {
				throw new Error("You must be an admin to respond to a refund request")
			}

			const refund = await prisma.customDateRefund.findUnique({
				where: {
					id: input.refundId,
				},
				include: {
					customDate: {
						include: {
							tastemaker: {
								select: {
									user: {
										select: {
											email: true,
											name: true,
										},
									},
								},
							},
							requestor: {
								select: {
									email: true,
									name: true,
								},
							},
						},
					},
				},
			})

			if (!refund) {
				throw new Error("Refund not found")
			}

			try {
				const status = await prisma.customDateRefundStatus.findUnique({
					where: {
						name: input.accepted ? "refunded" : "denied",
					},
				})

				if (!status) {
					throw new Error("Status not found")
				}
				match(input.accepted)
					.with(true, async () => {
						await emailQueue.add(
							"email",
							acceptedRefundEmailForTastemaker({
								email: refund.customDate.tastemaker.user.email,
								reason: input.reason,
								requestor: refund.customDate.requestor.name,
							}),
						)
						await emailQueue.add(
							"email",
							acceptedRefundEmailForUser({
								email: refund.customDate.requestor.email,
								tastemakerName: refund.customDate.tastemaker.user.name,
							}),
						)
						// mark custom date as completed
						// so they can remove cards if need be.
						await prisma.customDate.update({
							where: {
								id: refund.customDateId,
							},
							data: {
								completed: true,
							},
						})
					})
					.with(false, async () => {
						// we declined their refund request - they owe us money.
						await emailQueue.add(
							"email",
							deniedRefundEmailTastemaker({
								email: refund.customDate.tastemaker.user.email,
								reason: input.reason,
								requestor: refund.customDate.requestor.name,
							}),
						)
						await emailQueue.add(
							"email",
							deniedRefundEmailUser({
								email: refund.customDate.requestor.email,
								tastemakerName: refund.customDate.tastemaker.user.name,
								reason: input.reason,
							}),
						)
						// TODO: pay tastemaker

						// mark custom date as completed
						// so they can remove cards if need be after they paid.
						await prisma.customDate.update({
							where: {
								id: refund.customDateId,
							},
							data: {
								completed: true,
							},
						})
					})
					.exhaustive()

				return await prisma.customDateRefund.update({
					where: {
						id: refund.id,
					},
					data: {
						statusId: status.id,
					},
				})
			} catch {
				throw new Error("Could not update refund request")
			}
		},
	}),
}))
