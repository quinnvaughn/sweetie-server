import * as dotenv from "dotenv"
import { z } from "zod"

dotenv.config({ path: ".env" })

const env = z
	.object({
		PORT: z.number().or(z.string()).default(4000),
		NODE_ENV: z
			.literal("development")
			.or(z.literal("production"))
			.default("development"),
		DATABASE_URL: z.string().url(),
		REDIS_URL: z.string().url(),
		GOOGLE_CLOUD_PROJECT_ID: z.string(),
		IMAGE_BUCKET: z.string(),
		POSTMARK_API_KEY: z.string(),
		EMAIL_FROM: z.string().email(),
		GOOGLE_CREDENTIALS_PRIVATE_KEY: z.string(),
		GOOGLE_CREDENTIALS_CLIENT_EMAIL: z.string().email(),
		GOOGLE_MAPS_API_KEY: z.string(),
		MIXPANEL_TOKEN: z.string(),
		FRONTEND_URL: z.string().url(),
		STRIPE_API_KEY: z.string(),
		SESSION_SECRET: z.string(),
	})
	.parse(process.env)

export const config = {
	...env,
}
