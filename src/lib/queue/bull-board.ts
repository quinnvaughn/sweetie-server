import { customDateQueue } from "./custom-date"
import { createBullBoard } from "@bull-board/api"
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter"
import { ExpressAdapter } from "@bull-board/express"

const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath("/admin/queues")

createBullBoard({
	queues: [new BullMQAdapter(customDateQueue)],
	serverAdapter: serverAdapter,
})

export { serverAdapter }
