import { Tastemaker } from "@prisma/client"
import { DateTime } from "luxon"
import { prisma } from "../db"
import { distanceAndDuration, generateTravelBetweenLocations } from "../lib"
import { omit } from "../lib/object"
import {
	addresses,
	country,
	dateStopOptions,
	freeDate,
	getUsers,
	groupDates,
	laCities,
	locations,
	orderedDateStops,
	roles,
	state,
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
		await tx.categorizedDateList.deleteMany({})
		// await tx.customDateStatus.deleteMany({})
		// await tx.customDateRefundStatus.deleteMany({})
		// await tx.customDateSuggestionStatus.deleteMany({})
		// await tx.customDate.deleteMany({})
		await tx.orderedDateStop.deleteMany({})
		await tx.dateStopOption.deleteMany({})
		await tx.tastemaker.deleteMany({})
		await tx.plannedDate.deleteMany({})
		await tx.role.deleteMany({})
		await tx.state.deleteMany({})
		await tx.user.deleteMany({})
		await tx.travel.deleteMany({})
		await tx.distance.deleteMany({})
		await tx.duration.deleteMany({})
		await tx.tag.deleteMany({})
		await tx.groupDate.deleteMany({})
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
										text: tag,
									},
									create: {
										text: tag,
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
										text: tag,
									},
									create: {
										text: tag,
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
				orderedStops: {
					select: {
						id: true,
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
							text: tag,
						},
						create: {
							text: tag,
						},
					})),
				},
				orderedStops: {
					create: orderedDateStops.map((stop, i) => ({
						order: stop.order,
						estimatedTime: stop.estimatedTime,
						optional: stop.optional,
						options: {
							create: dateStopOptions
								.filter((option) => option.order === i + 1)
								.map((option) => {
									const location = locations.find(
										(location) => location.id === option.locationId,
									)
									const address = addresses.find(
										(address) => address.id === option.locationId,
									)
									return {
										optionOrder: option.optionOrder,
										title: option.title,
										content: option.content,
										location: {
											create: location
												? {
														name: location.name,
														website: location.website,
														address: {
															create: address
																? {
																		street: address.street,
																		postalCode: address.postalCode,
																		cityId: city?.id ?? "",
																		coordinates: {
																			create: {
																				lat: location.coordinates.lat,
																				lng: location.coordinates.lng,
																			},
																		},
																  }
																: undefined,
														},
												  }
												: undefined,
										},
									}
								}),
						},
					})),
				},
			},
		})
		await distanceAndDuration(
			tx,
			createdFreeDate.orderedStops.map((stop) => stop.id),
		)
		await tx.freeDateVariation.create({
			data: {
				freeDateId: createdFreeDate.id,
				plannedDates: {
					create: {
						userId: user?.id as string,
						// add 1 day to current date
						plannedTime: DateTime.now().plus({ days: 1 }).toISO() as string,
					},
				},
			},
		})
		await tx.categorizedDateList.create({
			data: {
				title: "The Beach",
				dates: {
					connect: {
						id: createdFreeDate.id,
					},
				},
				order: 1,
				description:
					"Anybody that beaches him off will have to beach me off first.",
			},
		})
		// los angeles city
		const losAngeles = await tx.city.findFirst({
			where: {
				name: "Los Angeles",
			},
		})
		// create groupDate
		for (const groupDate of groupDates) {
			if (!losAngeles) {
				throw new Error("Event must have locations")
			}
			const tastemaker = await tx.tastemaker.findFirst({
				where: {
					user: {
						email: groupDate.userEmail,
					},
				},
			})
			// create locations
			const locations = await Promise.all(
				groupDate.locations.map((location) =>
					tx.location.create({
						data: {
							name: location.name,
							website: location.website,
							images: {
								set: location.images,
							},
							address: {
								create: {
									street: location.address.street,
									postalCode: location.address.postalCode,
									cityId: losAngeles.id,
									coordinates: {
										create: {
											lat: location.lat,
											lng: location.lng,
										},
									},
								},
							},
						},
					}),
				),
			)
			// create travel between locations
			for (const [i, location] of locations.entries()) {
				// if it's the last location, then don't create travel
				if (i === locations.length - 1) {
					break
				}
				// get the next location
				const nextLocation = locations[i + 1]
				// if there is no next location, then don't create travel
				if (!nextLocation) {
					break
				}
				await generateTravelBetweenLocations(tx, location.id, nextLocation.id)
			}
			await tx.groupDate.create({
				data: {
					description: groupDate.description,
					title: groupDate.title,
					image: groupDate.image,
					maximumPrice: groupDate.maximumPrice,
					minimumPrice: groupDate.minimumPrice,
					numSpots: groupDate.numSpots,
					startDate: groupDate.startDate,
					lastSignupDate: groupDate.lastSignupDate,
					waitlist: {
						create: {},
					},
					tastemakerId: tastemaker?.id as string,
					addOns: {
						create: groupDate.addOns.map((addOn) => ({
							name: addOn.name,
							description: addOn.description,
							minimumPrice: addOn.minimumPrice,
							maximumPrice: addOn.maximumPrice,
							image: addOn.image,
							order: addOn.order,
						})),
					},
					products: {
						create: groupDate.products.map((product) => ({
							name: product.name,
							description: product.description,
							image: product.image,
							order: product.order,
						})),
					},
					stops: {
						create: groupDate.stops.map((stop) => {
							const stopLocation = groupDate.locations.find(
								(location) => location.id === stop.locationId,
							)
							return {
								description: stop.description,
								order: stop.order,
								location: {
									connect: {
										id: locations.find(
											(location) => location.name === stopLocation?.name,
										)?.id as string,
									},
								},
							}
						}),
					},
				},
			})
		}
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
