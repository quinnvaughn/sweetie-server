import { PrismaClient } from "@prisma/client"

type StopInput = {
	title: string
	content: string
	order: number
	estimatedTime: number
	locationId: string
}

export async function createStops(
	prisma: PrismaClient,
	freeDateId: string,
	stops: StopInput[],
) {
	// order the stops by the order property lower to higher
	const promises = stops
		.sort((a, b) => a.order - b.order)
		.map(async (stop, i) => {
			const { locationId, ...rest } = stop
			const location = await prisma.location.findUnique({
				where: {
					id: locationId,
				},
				include: {
					address: {
						include: {
							coordinates: true,
						},
					},
				},
			})
			if (!location) throw new Error("Location not found")
			// if the stop is not the first one, get the previous stop's location
			const previousLocation =
				i === 0
					? null
					: await prisma.location.findUnique({
							where: {
								id: stops[i - 1]?.locationId,
							},
							include: {
								address: {
									include: {
										coordinates: true,
									},
								},
							},
					  })
			if (i !== 0 && !previousLocation && previousLocation !== null)
				throw new Error("Previous location not found")
			const { lat: preLat, lng: preLng } = location.address.coordinates
			const { lat, lng } = previousLocation.address.coordinates
			// if date stop is not last, it will have an origin travel
			// if date stop is not first, it will have a destination travel
			return prisma.dateStop.create({
				data: {
					...rest,
					freeDateId,
					locationId,
				},
			})
		})
	await Promise.all(promises)
}
