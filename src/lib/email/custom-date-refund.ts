import { config } from "../../config"
import { EmailReturnType } from "./client"

type AdminProps = {
	requestor: string
	requestId: string
}

export function emailForAdmin({
	requestor,
	requestId,
}: AdminProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestor} has requested a refund`,
		To: "quinn@blushdates.com",
		HtmlBody: `Check out the refund request here: ${config.FRONTEND_URL}/admin/refunds/${requestId}`,
	}
}

type TastemakerProps = {
	requestor: string
	tastemakerEmail: string
}

export function emailForTastemaker({
	requestor,
	tastemakerEmail,
}: TastemakerProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestor} has requested a refund`,
		To: tastemakerEmail,
		HtmlBody: `${requestor} requeste a refund. We will let you know if it is approved via email.`,
	}
}

type TastemakerRefundProps = {
	email: string
	reason: string
	requestor: string
}

export function acceptedRefundEmailForTastemaker({
	email,
	reason,
	requestor,
}: TastemakerRefundProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestor}'s refund has been approved`,
		To: email,
		HtmlBody: `${requestor}'s refund has been approved. The reason given was: "${reason}".`,
	}
}

export function acceptedRefundEmailForUser({
	email,
	tastemakerName,
}: { email: string; tastemakerName: string }): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: "Your refund has been approved",
		To: email,
		HtmlBody: `Your refund request from ${tastemakerName} has been approved. You should see the refund in your account within 5-10 business days.`,
	}
}

export function deniedRefundEmailTastemaker({
	email,
	reason,
	requestor,
}: TastemakerRefundProps): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: `${requestor}'s refund has been denied`,
		To: email,
		HtmlBody: `${requestor}'s refund has been denied. The reason given was: "${reason}".`,
	}
}

export function deniedRefundEmailUser({
	email,
	reason,
	tastemakerName,
}: { email: string; reason: string; tastemakerName: string }): EmailReturnType {
	return {
		From: config.EMAIL_FROM,
		Subject: "Your refund has been denied",
		To: email,
		HtmlBody:
			// TODO: Add a way to contact us.
			`Your refund request from ${tastemakerName} has been denied. The reason given was: "${reason}".`,
	}
}
