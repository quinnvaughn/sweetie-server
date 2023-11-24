import { config } from "./config"
import { Context, createContext, createSubscriptionContext } from "./context"
import { serverAdapter } from "./lib/queue/bull-board"
import { schema } from "./schema"
import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import { json } from "body-parser"
import cors from "cors"
import express from "express"
import session from "express-session"
import { useServer } from "graphql-ws/lib/use/ws"
import { createServer } from "http"
import { WebSocketServer } from "ws"
import RedisStore from "connect-redis"
import cookieParser from "cookie-parser"
import { connection } from "./lib/queue/connection"

const app = express()

app.use("/admin/queues", serverAdapter.getRouter())

app.use(cookieParser())

const httpServer = createServer(app)

const wsServer = new WebSocketServer({
	server: httpServer,
	path: "/",
})

const serverCleanup = useServer(
	{
		schema,
		context: async () => {
			return createSubscriptionContext()
		},
	},
	wsServer,
)

const server = new ApolloServer<Context>({
	schema,
	plugins: [
		ApolloServerPluginDrainHttpServer({ httpServer }),
		{
			async serverWillStart() {
				return {
					async drainServer() {
						await serverCleanup.dispose()
					},
				}
			},
		},
	],
})

async function main() {
	await server.start()

	app.use(
		"/",
		session({
			name: 'qid',
			secret: config.SESSION_SECRET,
			resave: false,
			saveUninitialized: false,
			store: new RedisStore({ client: connection, disableTouch: true}),
			cookie: {
			  httpOnly: true,
			  sameSite: 'lax',
			  secure: process.env.NODE_ENV === 'production',
			  maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
			},
		  }),
		cors<cors.CorsRequest>({
			origin: ["http://localhost:3000", "https://sweetie-prod-web-0fd3458f0307.herokuapp.com/", "https://trysweetie.com", "https://api.postmarkapp.com", "https://studio.apollographql.com"],
			credentials: true,
		}),
		json(),
		expressMiddleware(server, {
			context: ({ req }) => createContext(req),
		}),
	)

	await new Promise<void>((resolve) =>
		httpServer.listen({ port: config.PORT }, resolve),
	)
	console.log(`🚀 Server ready at http://localhost:${config.PORT}`)
}

main()
