import { config } from "../../config"
import IORedis from "ioredis"



export const connection = new IORedis(config.REDIS_URL, {
	maxRetriesPerRequest: null,
	enableAutoPipelining: true,
	tls: process.env.NODE_ENV !== "production" ? undefined :{
		rejectUnauthorized: false,
	},
	commandTimeout: 10000,
})
