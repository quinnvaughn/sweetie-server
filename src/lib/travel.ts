import { TravelMode } from "@googlemaps/google-maps-services-js"
import { Prisma, PrismaClient, TravelMode as TM } from "@prisma/client"
import { DefaultArgs } from "@prisma/client/runtime/library"
import { config } from "../config"
import { googleMapsClient } from "./gcp"

export async function distanceAndDuration(
	prisma:
		| PrismaClient
		| Omit<
				PrismaClient<Prisma.PrismaClientOptions, never, DefaultArgs>,
				| "$connect"
				| "$disconnect"
				| "$on"
				| "$transaction"
				| "$use"
				| "$extends"
		  >,
	stopIds: string[],
) {
	const stops = await prisma.orderedDateStop.findMany({
		where: {
			id: {
				in: stopIds,
			},
		},
		orderBy: {
			order: "asc",
		},
		include: {
			options: {
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
	// algo is n^3 but there aren't that many stops
	// so it should never be that slow
	// If someone could come up with a better algo, that would be great
	for (let j = 0; j < stops.length; j++) {
		if (j === stops.length - 1) break
		// get all stops with that order
		const stop = stops[j]
		const nextStop = stops[j + 1]
		// if there are no stops with that order, continue
		if (!stop?.options) continue
		// if there are no next stops, continue
		if (!nextStop?.options) continue
		// cycle through all the stops with that order
		for (let i = 0; i < stop.options.length; i++) {
			const option = stop.options[i]
			// cycle through all the next stops
			// this is because you could have:
			// 3 possible options for this current stop
			// and 3 possible options for the next stop
			// so we need to check all possible combinations
			for (let k = 0; k < nextStop.options.length; k++) {
				const nextStopOption = nextStop.options[k]
				if (!nextStopOption?.location.address.coordinates) continue
				if (!option?.location.address.coordinates) continue
				// check if travel already exists
				// saves us from making an unnecessary API call
				const travelExists = await prisma.travel.findFirst({
					where: {
						originId: option.locationId,
						destinationId: nextStopOption.locationId,
					},
				})
				if (travelExists) continue
				const { lat, lng } = option.location.address.coordinates
				const { lat: nextLat, lng: nextLng } =
					nextStopOption.location.address.coordinates
				// if the current stop and the next stop are the same, then it's a walk
				if (lat === nextLat && lng === nextLng) {
					await prisma.travel.create({
						data: {
							distance: {
								create: { value: 0 },
							},
							duration: {
								create: { value: 0 },
							},
							originId: option.locationId,
							destinationId: nextStopOption.locationId,
							mode: TM.WALK,
						},
					})
					continue
				}
				const { data: walkingData } = await googleMapsClient.distancematrix({
					params: {
						mode: TravelMode.walking,
						origins: [`${lat},${lng}`],
						destinations: [`${nextLat},${nextLng}`],
						key: config.GOOGLE_MAPS_API_KEY,
					},
				})

				const { data: drivingData } = await googleMapsClient.distancematrix({
					params: {
						mode: TravelMode.driving,
						origins: [`${lat},${lng}`],
						destinations: [`${nextLat},${nextLng}`],
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
							originId: option.locationId,
							destinationId: nextStopOption.locationId,
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
							originId: option.locationId,
							destinationId: nextStopOption.locationId,
							mode,
						},
					})
				}
			}
		}
	}
}
