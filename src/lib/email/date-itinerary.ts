import { DateTime } from "luxon"
import { config } from "../../config"
import { EmailReturnType } from "./client"
import { generateLink } from "./general"

type DateItineraryProps = {
	email: string
	title: string
	date: DateTime
	icsValues: string[]
	stops: string[]
	subject: string
}

const text =
	"Please download all the attached files here 👇. You can then click on the downloaded ics files to add them to your calendar."

const signature = `<br/><br/><p>Thanks for letting ${generateLink(
	"https://trysweetie.com",
	"Sweetie",
)} choose your next date.</p>`

function generateAttachments(icsValues: string[], stops: string[]) {
	return icsValues.map((ics, i) => ({
		ContentID: `calendar${i}`,
		Name: `${stops[i]}.ics`,
		Content: Buffer.from(ics).toString("base64"),
		ContentType: "application/ics; charset=utf-8; method=PUBLISH",
	}))
}

export function dateItineraryForViewer({
	email,
	title,
	date,
	stops,
	subject,
	icsValues,
	guestName,
}: DateItineraryProps & { guestName?: string | null }): EmailReturnType {
	const attachments = generateAttachments(icsValues, stops)
	return {
		From: config.EMAIL_FROM,
		Subject: subject,
		To: email,
		HtmlBody: `<p>Save the date! You're going on ${title}${
			guestName ? ` with ${guestName} ` : " "
		}on ${date.month}/${date.day} starting at ${date.toLocaleString(
			DateTime.TIME_SIMPLE,
		)}. ${text}</p>${signature}`,
		Attachments: attachments,
	}
}

type GuestProps = DateItineraryProps & {
	name?: string | null
	inviterName: string
}

export function dateItineraryForGuest({
	email,
	date,
	title,
	subject,
	icsValues,
	stops,
	name,
	inviterName,
}: GuestProps): EmailReturnType {
	const attachments = generateAttachments(icsValues, stops)
	return {
		From: config.EMAIL_FROM,
		Subject: subject,
		To: email,
		HtmlBody: `<p>Get ready${
			name ? ` ${name}` : ""
		}! You're invited to go on ${title} with ${inviterName} on ${date.month}/${
			date.day
		} starting at ${date.toLocaleString(
			DateTime.TIME_SIMPLE,
		)}. ${text}</p>${signature}`,
		Attachments: attachments,
	}
}
