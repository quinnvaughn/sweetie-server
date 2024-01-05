import { User } from "@prisma/client"
import * as Sentry from "@sentry/node"
import { google, oauth2_v2 } from "googleapis"
import { config } from "../../config"

export const oauth2Client = new google.auth.OAuth2(
	config.GOOGLE_CLIENT_ID,
	config.GOOGLE_CLIENT_SECRET,
	config.FRONTEND_URL,
)

export async function viewerAuthorizedCalendar(user?: User | null) {
	if (!user) return false
	if (!user.googleRefreshToken) return false
	try {
		oauth2Client.setCredentials({
			refresh_token: user.googleRefreshToken,
		})
		const { data } = await oauth2Client.request<oauth2_v2.Schema$Tokeninfo>({
			url: "https://www.googleapis.com/oauth2/v2/tokeninfo",
			method: "GET",
		})
		if (!data.scope) return false
		return data.scope?.includes("https://www.googleapis.com/auth/calendar")
	} catch (e) {
		Sentry.setUser({ id: user.id, email: user.email })
		Sentry.captureException(e)
		return false
	}
}
