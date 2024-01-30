import { TravelMode } from "@googlemaps/google-maps-services-js"
import { PrismaClient, TravelMode as TM } from "@prisma/client"
import { config } from "../config"
import { googleMapsClient } from "./gcp"

export async function distanceAndDuration(
	prisma: PrismaClient,
	freeDateId: string,
) {
	const stops = await prisma.dateStop.findMany({
		where: {
			freeDateId,
		},
		orderBy: {
			order: "asc",
		},
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
	})
	for (let j = 0; j < stops.length; j++) {
		if (j === 0) continue
		const stop = stops[j]
		const previousStop = stops[j - 1]
		if (!stop?.location) continue
		if (!previousStop?.location.address.coordinates) continue
		if (!stop.location.address.coordinates) continue
		const { lat: preLat, lng: preLng } =
			previousStop.location.address.coordinates
		const { lat, lng } = stop.location.address.coordinates
		// if the previous stop and the current stop are the same, then it's a walk
		if (preLat === lat && preLng === lng) {
			await prisma.travel.create({
				data: {
					distance: {
						create: { value: 0 },
					},
					duration: {
						create: { value: 0 },
					},
					originId: previousStop.id,
					destinationId: stop.id,
					mode: TM.WALK,
				},
			})
			continue
		}
		const { data: walkingData } = await googleMapsClient.distancematrix({
			params: {
				mode: TravelMode.walking,
				origins: [`${preLat},${preLng}`],
				destinations: [`${lat},${lng}`],
				key: config.GOOGLE_MAPS_API_KEY,
			},
		})

		const { data: drivingData } = await googleMapsClient.distancematrix({
			params: {
				mode: TravelMode.driving,
				origins: [`${preLat},${preLng}`],
				destinations: [`${lat},${lng}`],
				key: config.GOOGLE_MAPS_API_KEY,
			},
		})

		if (!walkingData.rows[0]?.elements[0]?.distance.value) continue
		if (!walkingData.rows[0]?.elements[0]?.duration.value) continue

		// if there is no driving data, then it's a boat
		if (
			!drivingData.rows[0]?.elements[0]?.distance?.value &&
			!drivingData.rows[0]?.elements[0]?.duration?.value
		) {
			await prisma.travel.create({
				data: {
					distance: {
						create: { value: 0 },
					},
					duration: {
						create: { value: 0 },
					},
					originId: previousStop.id,
					destinationId: stop.id,
					mode: TM.BOAT,
				},
			})
		} else {
			// one mile in meters
			const thresholdinMeters = 1609.34
			const walkingDistance = walkingData.rows[0].elements[0].distance.value
			const mode = walkingDistance > thresholdinMeters ? TM.CAR : TM.WALK
			const distanceData =
				mode === TM.CAR
					? drivingData.rows[0].elements[0].distance.value
					: walkingData.rows[0].elements[0].distance.value
			const durationData =
				mode === TM.CAR
					? drivingData.rows[0].elements[0].duration.value
					: walkingData.rows[0].elements[0].duration.value
			await prisma.travel.create({
				data: {
					distance: {
						create: { value: distanceData },
					},
					duration: {
						create: { value: durationData },
					},
					originId: previousStop.id,
					destinationId: stop.id,
					mode,
				},
			})
		}
	}
}
