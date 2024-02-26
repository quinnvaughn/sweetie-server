import { EmailReturnType } from "./client"

type Props = {
	userName: string
	email: string
	groupDateTitle: string
	code: string
	groupDateId: string
}

export function userSignsUpForGroupDateWaitlist({
	email,
	userName,
	groupDateTitle,
	code,
	groupDateId,
}: Props): EmailReturnType {
	const name = userName.split(" ")[0]
	const link = `https://trysweetie.com/group-date/${groupDateId}?code=${code}`
	return {
		From: "quinn@trysweetie.com",
		Subject: `Thanks for signing up for the waitlist, ${name}!`,
		To: email,
		HtmlBody: `<div><p>Hey ${name},</p><p>Thanks a bunch for signing up for our waitlist for ${groupDateTitle}! 😊</p><p>Your interest means a lot to us! To help make this idea happen, inviting your friends not only increases the chances of it coming to life but also moves you up the waitlist. Cool, right?</p><p>Your code is <b>${code}</b>, or you can send them this link: <a href="${link}">${link}</a></p><p>Spread the word and get your pals involved! Let's make this happen together!</p><p>Cheers,</p><p>Quinn</p><br/><p>P.S. If you have any questions, feel free to respond to this email and I'll get back to you as soon as I can!</p></div>`,
	}
}
