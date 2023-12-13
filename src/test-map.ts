import { prisma } from "./db"
import { distanceAndDuration } from "./lib"

async function main() {
	const dates = await prisma.freeDate.findMany({
		include: {
			stops: {
				include: {
					location: {
						include: {
							address: {
								include: {
									coordinates: true,
								},
							},
						},
					},
				},
			},
		},
	})
	for (let i = 0; i < dates.length; i++) {
		const stops = dates[i]?.stops
		if (!stops) continue
		if (stops.length === 1) continue
		distanceAndDuration(prisma, stops)
	}
	prisma.$disconnect()
}

main()
