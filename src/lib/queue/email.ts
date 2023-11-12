import { EmailReturnType, emailClient } from "../email"
import { connection } from "./connection"
import { Queue, Worker } from "bullmq"

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
