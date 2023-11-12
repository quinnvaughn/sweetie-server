import { prisma } from "../../db"
import { pubsub } from "../../pubsub"
import {
	ExpiredCustomDateEvent,
	publishCustomDateEvent,
} from "../../schema/subscription/custom-date"
import {
	customDateExpiredTastemakerEmail,
	customDateExpiredUserEmail,
} from "../email"
import { connection } from "./connection"
import { emailQueue } from "./email"
import { CustomDate } from "@prisma/client"
import { Queue, Worker } from "bullmq"
import { DateTime } from "luxon"
import { match } from "ts-pattern"

type CustomDateProps = {
	customDateId: string
}

export const customDateQueue = new Queue<CustomDateProps>("custom_date", {
	connection,
})

new Worker<CustomDateProps>(
	"custom_date",
	async (job) => {
		match(job.name)
			.with("check_acceptance", async () => {
				await checkAcceptance(job.data.customDateId)
			})
			.with("pay_tastemaker", async () => {
				await payTastemaker(job.data.customDateId)
			})
			.otherwise(() => {})
	},
	{ connection },
)

async function checkAcceptance(customDateId: string) {
	const customDate = await prisma.customDate.findUnique({
		where: {
			id: customDateId,
		},
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
	})

	// This means the user has at least responded to the custom date
	const acceptedOrDeclined = await prisma.customDateStatus.findMany({
		where: {
			name: {
				in: ["accepted", "declined"],
			},
		},
	})

	const expired = await prisma.customDateStatus.findUnique({
		where: {
			name: "expired",
		},
	})

	if (!customDate || acceptedOrDeclined.length !== 2 || !expired) return

	let newCustomDate: CustomDate | null = customDate
	// if user has not accepted or declined the custom date within 24 hours, send an email
	// and change the status to 'expired'
	if (!acceptedOrDeclined.some((status) => status.id === customDate.statusId)) {
		const now = DateTime.now()
		const then = DateTime.fromJSDate(customDate.createdAt)

		const diff = now.diff(then).as("hours")

		if (diff >= 24) {
			newCustomDate = await prisma.customDate.update({
				where: {
					id: customDate.id,
				},
				data: {
					statusId: expired.id,
					completed: true,
				},
			})
		}
		await emailQueue.add(
			"email",
			customDateExpiredUserEmail({
				to: customDate.requestor.email,
				tastemakerName: customDate.tastemaker.user.name,
			}),
		)
		await emailQueue.add(
			"email",
			customDateExpiredTastemakerEmail({
				to: customDate.tastemaker.user.email,
				requestorName: customDate.requestor.name,
			}),
		)
		await publishCustomDateEvent(
			new ExpiredCustomDateEvent(newCustomDate),
			pubsub,
		)
	}
}

async function payTastemaker(customDateId: string) {
	const customDate = await prisma.customDate.findUnique({
		where: {
			id: customDateId,
		},
		include: {
			refund: true,
			suggestions: {
				take: 1,
				orderBy: {
					revisionNumber: "desc",
				},
				include: {
					status: {
						select: {
							name: true,
						},
					},
				},
			},
		},
	})

	const accepted = await prisma.customDateSuggestionStatus.findUnique({
		where: {
			name: "accepted",
		},
	})

	if (!customDate || !accepted) return

	// if user has not requested a refund or
	// if the most recent suggestion is accepted, do not pay the tastemaker
	// Tastemaker was already paid when the suggestion was accepted
	// This is only to check when the 48 hour window is up and pay them if so.
	if (customDate.refund || customDate.suggestions[0]?.statusId === accepted.id)
		return

	// TODO: Charge user for custom date
	// cannot do this yet because Stripe isn't set up.
}

export async function removePayTastemaker(customDateId: string) {
	const delayed = await customDateQueue.getDelayed()

	// if there is still a job to pay tastemaker, remove it.
	const job = delayed.find(
		(j) => j.data.customDateId === customDateId && j.name === "pay_tastemaker",
	)

	if (job) {
		try {
			await job.remove()
		} catch {}
	}
}

export async function removeCheckAcceptance(customDateId: string) {
	const delayed = await customDateQueue.getDelayed()
	const job = delayed.find(
		(j) =>
			j.data.customDateId === customDateId && j.name === "check_acceptance",
	)
	if (job) {
		try {
			await job.remove()
		} catch {}
	}
}
