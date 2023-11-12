import { config } from "../../config"
import { EmailReturnType } from "./client"
import { generateLink } from "./general"
import { match } from "ts-pattern"

type DateRequestTastemakerProps = {
	email: string
	// Need to say who requested the date
	requestorName: string
}

type DateRequestUserProps = DateRequestTastemakerProps & {
	creatorName: string
}

type DateRequestorProps = {
	email: string
	creatorName: string
	customDateId: string
	status: string
}

export function dateRequestForTastemaker({
	email,
	requestorName,
}: DateRequestTastemakerProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestorName} requested a custom date from you!`,
		To: email,
		HtmlBody: `<p>${requestorName} has requested a custom date from you. Click the link ${generateLink(
			`${config.FRONTEND_URL}/tastemaker/custom-dates/requests`,
			"here",
		)} to respond to the request.</p>`,
	}
}

export function tellDateRequestorWeGotTheirCustomDateRequest({
	email,
	requestorName,
	creatorName,
}: DateRequestUserProps): EmailReturnType {
	const firstName = requestorName.split(" ")[0]
	return {
		From: config.EMAIL_FROM,
		Subject: `Thanks for requesting a custom date, ${firstName}!`,
		To: email,
		HtmlBody: `<p>Thanks for requesting a custom date, ${firstName}! We'll let you know when ${creatorName} responds to your request.</p><br/><p>A couple notes:</p><ul><li>They has 24 hours to respond to your request.</li><li>If they decline it, you will not be charged.</li><li>If they don't accept it within the 24 hours, it will be retired and you will not be charged.</li>`,
	}
}

// If they accept it, you will have 48 hours from that point to request a refund, if you believe the Tastemaker did not fill their end of the bargain. If you do not request a refund within 48 hours, you will be charged the full amount. We only accept refunds if the Tastemaker does not make a best effort, doesn't respond to requested suggestion changes, or doesn't respond, etc. We do not accept refunds if you simply didn't enjoy the date, as we have no way to prove that you didn't actually go on the date.

export function updateDateRequestor({
	email,
	creatorName,
	customDateId,
	status,
}: DateRequestorProps): EmailReturnType {
	const Subject = match(status)
		.with("accepted", () => `${creatorName} accepted your date request!`)
		.otherwise(() => `${creatorName} declined your date request.`)
	const HtmlBody = match(status)
		.with(
			"accepted",
			() =>
				`<p>${creatorName} accepted your date request. To view it, click ${generateLink(
					`${config.FRONTEND_URL}/dates/custom-dates/messages/${customDateId}`,
					"here",
				)}.</p><br/><br/></p><br/><p>A couple notes:</p><ul><li>You have 48 hours from now to request a refund. You will be charged at that point if you have not requested a refund.</li><li>We only accept refunds if the Tastemaker does not make a best effort, doesn't respond to requested suggestion changes, or doesn't respond, etc.</li><li>We do not accept refunds if you simply didn't enjoy the date, as we have no way to prove that you didn't actually go on the date.</li>`,
		)
		.otherwise(
			() => `Unfortunately, ${creatorName} declined your date request.`,
		)
	return {
		From: config.EMAIL_FROM,
		Subject,
		To: email,
		HtmlBody,
	}
}
