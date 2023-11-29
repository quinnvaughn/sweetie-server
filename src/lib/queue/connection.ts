import IORedis from "ioredis"
import { config } from "../../config"

export const connection = new IORedis(config.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableAutoPipelining: true,
	commandTimeout: 10000,
})
