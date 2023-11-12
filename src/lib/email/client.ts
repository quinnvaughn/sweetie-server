import { config } from "../../config"
import * as postmark from "postmark"

export const emailClient = new postmark.ServerClient(config.POSTMARK_API_KEY)

export type EmailReturnType = {
	From: string
	Subject: string
	To: string
	HtmlBody: string
	Attachments?: {
		ContentID: string
		Name: string
		Content: string
		ContentType: string
	}[]
}
