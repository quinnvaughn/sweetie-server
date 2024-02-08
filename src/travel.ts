import { prisma } from "./db"
import { distanceAndDuration } from "./lib"

async function main() {
	// delete all travel data
	await prisma.travel.deleteMany()
	// get all the dates
	const dates = await prisma.freeDate.findMany({
		include: {
			stops: {
				select: {
					id: true,
				},
			},
		},
	})

	for (const date of dates) {
		// go through and calculate travel
		await distanceAndDuration(
			prisma,
			date.stops.map((stop) => stop.id),
		)
	}
	console.log("done")
}

main()
	.finally(() => {
		prisma.$disconnect()
		process.exit(0)
	})
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
