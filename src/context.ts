import { PrismaClient, User } from "@prisma/client"
import { Request } from "express"
import { Session, SessionData } from "express-session"
import { PubSub } from "graphql-subscriptions"
// import { Context as WSContext } from "graphql-ws"
// import { Extra } from "graphql-ws/lib/use/ws"
import Stripe from "stripe"
import { v4 } from "uuid"
import { prisma } from "./db"
import { stripe } from "./lib"
import { pubsub } from "./pubsub"

export type SessionRequest = Request & {
	session: Session &
		Partial<SessionData> & { userId?: string; deviceId?: string }
}

export type Context = {
	prisma: PrismaClient
	currentUser: User | null
	req: SessionRequest
	pubsub: PubSub
	stripe: Stripe
}

export async function createContext(req: SessionRequest): Promise<Context> {
	const userId = req.session.userId
	const deviceId = req.session.deviceId
	if (!deviceId) {
		req.session.deviceId = v4()
	}
	let currentUser: User | null = null

	if (userId) {
		currentUser = await prisma.user.findUnique({
			where: {
				id: userId,
			},
		})
	}

	return {
		stripe,
		prisma,
		currentUser,
		req,
		pubsub,
	}
}

export async function createSubscriptionContext(
	// ctx: WSContext<
	// 	Record<string, unknown> | undefined,
	// 	Extra & Partial<Record<PropertyKey, never>>
	// >,
) {
	// const decoded = verifyToken((ctx.connectionParams?.authToken as string) || "")
	let currentUser: User | null = null
	// if (decoded?.id && typeof decoded.id === "string") {
	// 	currentUser = await prisma.user.findUnique({
	// 		where: {
	// 			id: decoded.id,
	// 		},
	// 	})
	// }

	return {
		prisma,
		currentUser,
		pubsub,
	}
}
