import { TravelMode } from "@googlemaps/google-maps-services-js"
import { DateStop, PrismaClient, TravelMode as TM } from "@prisma/client"
import { config } from "../config"
import { googleMapsClient } from "./gcp"

type Stop = DateStop & {
	location: {
		address: {
			coordinates: {
				lat: number
				lng: number
			} | null
		}
	}
}

export async function distanceAndDuration(prisma: PrismaClient, stops: Stop[]) {
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
		if (!drivingData.rows[0]?.elements[0]?.distance.value) continue
		if (!walkingData.rows[0]?.elements[0]?.duration.value) continue
		if (!drivingData.rows[0]?.elements[0]?.duration.value) continue
		// half a mile
		const thresholdinMeters = 804.672
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
				fromId: previousStop.id,
				toId: stop.id,
				mode,
			},
		})
	}
}
