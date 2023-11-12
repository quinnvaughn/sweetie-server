import { config } from "../../config"
import { EmailReturnType } from "./client"
import { generateLink } from "./general"

type CustomMessageProps = {
	to: string // email
	from: string // User's name
	customDateId: string
	isTastemaker: boolean // we change the url based on this.
}

function createLink({
	customDateId,
	isTastemaker,
}: { customDateId: string; isTastemaker: boolean }) {
	const url = isTastemaker
		? `${config.FRONTEND_URL}/tastemaker/custom-dates/messages/${customDateId}`
		: `${config.FRONTEND_URL}/dates/custom-dates/messages/${customDateId}`

	return generateLink(url, "here")
}

export function customMessageSentEmail({
	to,
	from,
	customDateId,
	isTastemaker,
}: CustomMessageProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: "Custom date message sent",
		To: to,
		HtmlBody: `${from} has sent you a message on your custom date. View the message ${createLink(
			{ customDateId, isTastemaker },
		)}.`,
	}
}
