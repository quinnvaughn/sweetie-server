import { config } from "../../config"
import { emailClient } from "./client"
import { generateLink } from "./general"

export async function sendRequestPasswordResetEmail(
	email: string,
	token: string,
) {
	await emailClient.sendEmail({
		From: config.EMAIL_FROM,
		Subject: "Password Reset Request",
		To: email,
		HtmlBody: `To reset your password, visit the following link: ${generateLink(
			`${config.FRONTEND_URL}/reset-password?token=${token}`,
			"Reset Password",
		)}<br/>The link is good for 10 minutes.<br/><br/>If you did not request a password reset, please ignore this email.`,
	})
}
