import { Queue, Worker } from "bullmq"
import React from "react"
import { resend } from "src/email"
import { EmailReturnType, emailClient } from "../email"
import { connection } from "./connection"

export const emailQueue = new Queue<EmailReturnType>("email", {
	connection,
})

new Worker<EmailReturnType>(
	"email",
	async (job) => {
		return await emailClient.sendEmail(job.data)
	},
	{ connection },
)

type ResendEmailData = {
	to: string
	from: string
	subject: string
	react: React.JSX.Element
}

export const resendQueue = new Queue<ResendEmailData>("resend", {
	connection,
})

new Worker<ResendEmailData>(
	"resend",
	async (job) => {
		return await resend.emails.send(job.data)
	},
	{ connection },
)
