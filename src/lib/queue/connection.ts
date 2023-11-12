import { config } from "../../config"
import IORedis from "ioredis"



export const connection = new IORedis(config.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableAutoPipelining: true,
	tls: config.NODE_ENV === "production" ? {
		rejectUnauthorized: false,
	} : undefined,
	commandTimeout: 10000,
})
