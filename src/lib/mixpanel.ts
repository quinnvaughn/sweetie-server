import { config } from "../config"
import { IncomingMessage } from "http"
import Mixpanel from "mixpanel"
import { UAParser } from "ua-parser-js"

const mixpanel = Mixpanel.init(config.MIXPANEL_TOKEN)

function getValuesFromIP(
	req: IncomingMessage,
	props: Mixpanel.PropertyDict = {},
) {
	const ip = cleanUpIPAddress(
		(req.headers["x-forwarded-for"] as string) ||
			req.socket.remoteAddress ||
			"",
	)
	const userAgent = new UAParser(req.headers["user-agent"])
	return {
		ip,
		$browser: userAgent.getBrowser().name,
		$device: userAgent.getDevice().type,
		$os: userAgent.getOS().name,
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
	req: IncomingMessage,
	event: string,
	props: Mixpanel.PropertyDict,
	cb?: Mixpanel.Callback,
) => {
	const values = getValuesFromIP(req, props)
	mixpanel.track(event, values, cb)
}
