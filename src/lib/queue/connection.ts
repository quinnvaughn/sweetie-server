import { config } from "../../config"
import IORedis from "ioredis"



export const connection = new IORedis(config.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableAutoPipelining: true,
	tls: {
		rejectUnauthorized: process.env.NODE_ENV !== "production",
	},
	commandTimeout: 10000,
})
