import { config } from "../../config"
import { EmailReturnType } from "./client"
import { generateLink } from "./general"

type SuggestedDateProps = {
	to: string // email
	customDateId: string
	tastemakerName: string
}

export function tastemakerSuggestedDateEmail({
	to,
	customDateId,
	tastemakerName,
}: SuggestedDateProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${tastemakerName} has suggested a date for you!`,
		To: to,
		HtmlBody: `Please log in to see the suggested date: ${generateLink(
			`${config.FRONTEND_URL}/dates/custom-dates/messages/${customDateId}`,
			"View suggested date",
		)}`,
	}
}

export function tastemakerMadeChangesEmail({
	to,
	customDateId,
	tastemakerName,
}: SuggestedDateProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${tastemakerName} has made changes for you!`,
		To: to,
		HtmlBody: `Please log in to see the new suggested date: ${generateLink(
			`${config.FRONTEND_URL}/dates/custom-dates/messages/${customDateId}`,
			"View suggested date",
		)}`,
	}
}

export function requestorRequestedChangesEmail({
	to,
	customDateId,
	requestorName,
}: {
	to: string
	customDateId: string
	requestorName: string
}): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestorName} requested changes to your suggested date`,
		To: to,
		HtmlBody: `Please log in to see the requested changes: ${generateLink(
			`${config.FRONTEND_URL}/tastemaker/custom-dates/messages/${customDateId}`,
			"View requested changes",
		)}`,
	}
}

export function userAcceptedDateEmail({
	to,
	requestorName,
}: {
	to: string
	requestorName: string
}): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestorName} accepted your suggested date!`,
		To: to,
		HtmlBody:
			"Way to go! You should be proud of yourself. You're a great date planner! 🎉. You should be getting paid within the next few days.",
	}
}

export function customDateExpiredUserEmail({
	to,
	tastemakerName,
}: { to: string; tastemakerName: string }): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `Your date request for ${tastemakerName} has expired`,
		To: to,
		HtmlBody: `It's been 24 hours since you requested a date from ${tastemakerName}. Because they did not accept your date, it has expired. You can request another date from them if you'd like.`,
	}
}

export function customDateExpiredTastemakerEmail({
	to,
	requestorName,
}: { to: string; requestorName: string }): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `Your date request from ${requestorName} has expired`,
		To: to,
		HtmlBody: `It's been 24 hours since ${requestorName} requested a date from you. Because you did not accept their date, it has expired.`,
	}
}
