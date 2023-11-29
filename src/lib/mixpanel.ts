import url from "url"
import Mixpanel from "mixpanel"
import { UAParser } from "ua-parser-js"
import { config } from "../config"
import { SessionRequest } from "../context"

const mixpanel = Mixpanel.init(config.MIXPANEL_TOKEN)

function addValuesToProperties(
	req: SessionRequest,
	props: Mixpanel.PropertyDict = {},
) {
	console.log("req.ip", req.ip)
	console.log('req.headers["x-forwarded-for"]', req.headers["x-forwarded-for"])
	console.log("req.socket.remoteAddress", req.socket.remoteAddress)
	const ip = cleanUpIPAddress(
		req.ip ||
			(req.headers["x-forwarded-for"] as string) ||
			req.socket.remoteAddress ||
			"",
	)
	// get referer from headers
	const referer = req.headers.referer

	// get utm params from url
	const parsedURL = url.parse(req.url || "", true)
	const utmSource = parsedURL.query.utm_source
	const utmMedium = parsedURL.query.utm_medium
	const utmCampaign = parsedURL.query.utm_campaign
	const utmTerm = parsedURL.query.utm_term
	const utmContent = parsedURL.query.utm_content

	const userAgent = new UAParser(req.headers["user-agent"])

	// get user id from session
	const userId = req.session.userId
	// get device id from session
	const deviceId = req.session.deviceId
	return {
		ip,
		$browser: userAgent.getBrowser().name,
		$device: userAgent.getDevice().type,
		$os: userAgent.getOS().name,
		$referrer: referer,
		$initial_referrer: referer || "$direct",
		$initial_referring_domain: referer?.split("/")[2] || "$direct",
		$device_id: deviceId,
		$user_id: userId,
		$distinct_id: userId || `$device:${deviceId}`,
		$referring_domain: referer?.split("/")[2],
		utm_source: utmSource,
		utm_medium: utmMedium,
		utm_campaign: utmCampaign,
		utm_term: utmTerm,
		utm_content: utmContent,
		...props,
	}
}

function cleanUpIPAddress(ip: string) {
	if (ip.startsWith("::ffff:")) {
		return ip.substring(7)
	}
	return ip
}

export const track = (
	req: SessionRequest,
	event: string,
	props: Mixpanel.PropertyDict,
	cb?: Mixpanel.Callback,
) => {
	const values = addValuesToProperties(req, props)
	mixpanel.track(event, values, cb)
}

export const peopleSet = (
	req: SessionRequest,
	props: Mixpanel.PropertyDict,
	cb?: Mixpanel.Callback,
) => {
	const values = addValuesToProperties(req, props)
	mixpanel.people.set(values.$distinct_id, values, cb)
}

export const peopleSetOnce = (
	req: SessionRequest,
	props: Mixpanel.PropertyDict,
	cb?: Mixpanel.Callback,
) => {
	const values = addValuesToProperties(req, props)
	mixpanel.people.set_once(values.$distinct_id, values, cb)
}

export const peopleIncrement = (
	req: SessionRequest,
	props: Mixpanel.PropertyDict,
	cb?: Mixpanel.Callback,
) => {
	const values = addValuesToProperties(req, props)
	mixpanel.people.increment(values.$distinct_id, props, cb)
}
