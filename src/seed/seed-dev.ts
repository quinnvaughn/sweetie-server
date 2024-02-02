import { Tastemaker } from "@prisma/client"
import { DateTime } from "luxon"
import { prisma } from "../db"
import { omit } from "../lib/object"
import {
	addresses,
	country,
	freeDate,
	getUsers,
	laCities,
	locations,
	roles,
	state,
	stops,
	tastemakers,
} from "./data"

async function seed() {
	// create records here
	const users = await getUsers()

	await prisma.$transaction(async (tx) => {
		await tx.location.deleteMany({})
		await tx.address.deleteMany({})
		await tx.city.deleteMany({})
		await tx.country.deleteMany({})
		await tx.freeDateDraft.deleteMany({})
		await tx.freeDate.deleteMany({})
		// await tx.customDateStatus.deleteMany({})
		// await tx.customDateRefundStatus.deleteMany({})
		// await tx.customDateSuggestionStatus.deleteMany({})
		// await tx.customDate.deleteMany({})
		await tx.dateStop.deleteMany({})
		await tx.tastemaker.deleteMany({})
		await tx.plannedDate.deleteMany({})
		await tx.role.deleteMany({})
		await tx.state.deleteMany({})
		await tx.user.deleteMany({})
		await tx.travel.deleteMany({})
		await tx.distance.deleteMany({})
		await tx.duration.deleteMany({})
		await tx.tag.deleteMany({})
	})

	await prisma.$transaction(async (tx) => {
		const generatedRoles = await Promise.all(
			roles.map((role) => tx.role.create({ data: role })),
		)

		const generatedUsers = await Promise.all(
			users.map((user) =>
				tx.user.create({
					data: {
						...omit(user, "role"),
						roleId:
							generatedRoles.find((role) => role.name === user.role)?.id ?? "",
						tastemaker:
							tastemakers.filter((tastemaker) => tastemaker.user === user.email)
								.length === 0
								? {
										create: {},
								  }
								: undefined,
					},
					include: {
						tastemaker: {
							select: {
								id: true,
							},
						},
					},
				}),
			),
		)
		const createdCountry = await tx.country.create({ data: { ...country } })
		const createdState = await tx.state.create({
			data: {
				...state,
				countryId: createdCountry.id,
			},
		})

		await tx.city.createMany({
			data: laCities.map((city) => ({
				name: city,
				stateId: createdState.id,
			})),
		})

		const user = generatedUsers[0]

		const city = await tx.city.findFirst({
			where: { name: addresses[0]?.city },
			select: {
				id: true,
			},
		})
		const generatedTastemakers: Tastemaker[] = []
		for (let i = 0; i < tastemakers.length; i++) {
			const tastemaker = tastemakers[i] as (typeof tastemakers)[0]
			const doesNotDoCities = await tx.city.findMany({
				where: {
					name: {
						in: tastemaker.doesNotDo.cities,
					},
				},
			})
			const specializesInCities = await tx.city.findMany({
				where: {
					name: {
						in: tastemaker.specializesIn.cities,
					},
				},
			})
			const result = await tx.tastemaker.create({
				data: {
					...omit(tastemaker, "doesNotDo", "specializesIn", "user"),
					user: {
						connect: {
							email: tastemaker.user,
						},
					},
					doesNotDo: {
						create: {
							tags: {
								connectOrCreate: tastemaker.doesNotDo.tags.map((tag) => ({
									where: {
										name: tag,
									},
									create: {
										name: tag,
									},
								})),
							},
							cities: {
								connect: doesNotDoCities.map((city) => ({ id: city.id })),
							},
						},
					},
					specializesIn: {
						create: {
							tags: {
								connectOrCreate: tastemaker.specializesIn.tags.map((tag) => ({
									where: {
										name: tag,
									},
									create: {
										name: tag,
									},
								})),
							},
							cities: {
								connect: specializesInCities.map((city) => ({ id: city.id })),
							},
						},
					},
				},
			})
			generatedTastemakers.push(result)
		}
		const tastemaker = generatedTastemakers[0]
		const createdFreeDate = await tx.freeDate.create({
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
			data: {
				tastemakerId: tastemaker?.id as string,
				thumbnail: freeDate.thumbnail,
				title: freeDate.title,
				description: freeDate.description,
				tags: {
					connectOrCreate: freeDate.tags.map((tag) => ({
						where: {
							name: tag,
						},
						create: {
							name: tag,
						},
					})),
				},
				stops: {
					create: stops.map((stop, i) => {
						return {
							title: stop.title,
							content: stop.content,
							order: i + 1,
							location: {
								create: {
									name: locations[i]?.name ?? "",
									website: locations[i]?.website ?? "",
									address: {
										create: {
											street: addresses[i]?.street ?? "",
											postalCode: addresses[i]?.postalCode ?? "",
											cityId: city?.id ?? "",
											coordinates: {
												create: {
													lat: locations[i]?.coordinates.lat as number,
													lng: locations[i]?.coordinates.lng as number,
												},
											},
										},
									},
								},
							},
						}
					}),
				},
			},
		})
		const orderedStops = createdFreeDate.stops.sort((a, b) => a.order - b.order)
		for (let i = 0; i < orderedStops.length; i++) {
			// Make all of the distances 0.1 miles and 1 minute
			// to make the itinerary look good
			if (i === 0) continue
			const stop = orderedStops[i]
			const previousStop = orderedStops[i - 1]
			if (!stop?.location) continue
			if (!previousStop?.location.address.coordinates) continue
			if (!stop.location.address.coordinates) continue
			await tx.travel.create({
				data: {
					distance: {
						create: { value: 0.1 },
					},
					duration: {
						// 1 minute in seconds
						create: { value: 60 },
					},
					originId: previousStop.id,
					destinationId: stop.id,
					mode: "WALK",
				},
			})
		}
		await tx.plannedDate.create({
			data: {
				freeDateId: createdFreeDate.id,
				userId: user?.id as string,
				// add 1 day to current date
				plannedTime: DateTime.now().plus({ days: 1 }).toISO() as string,
			},
		})
		// const statuses = await Promise.all(
		// 	customDateStatuses.map((status) =>
		// 		tx.customDateStatus.create({ data: { name: status } }),
		// 	),
		// )
		// for (let i = 0; i < customDates.length; i++) {
		// 	const customDate = customDates[i] as (typeof customDates)[0]
		// 	const requestor = generatedUsers[1] as User
		// 	await tx.customDate.create({
		// 		data: {
		// 			...omit(customDate, "requestor", "tastemaker", "status", "tags"),
		// 			requestorId: requestor.id as string,
		// 			tastemakerId: generatedTastemakers[0]?.id as string,
		// 			statusId: statuses[0]?.id as string,
		// 			tags: {
		// 				connectOrCreate: customDate.tags.map((tag) => ({
		// 					where: {
		// 						name: tag,
		// 					},
		// 					create: {
		// 						name: tag,
		// 					},
		// 				})),
		// 			},
		// 		},
		// 	})
		// }
		// await Promise.all(
		// 	customDateSuggestionStatuses.map((status) =>
		// 		tx.customDateSuggestionStatus.create({ data: { name: status } }),
		// 	),
		// )
		// await Promise.all(
		// 	customDateRefundStatuses.map((status) =>
		// 		tx.customDateRefundStatus.create({ data: { name: status } }),
		// 	),
		// )
	})
}

seed()
	.catch(console.error)
	.finally(async () => {
		await prisma.$disconnect()
		// it wasn't exiting on its own
		// so I added this
		process.exit(0)
	})
