import { omit } from "../lib/object"
import {
	addresses,
	country,
	customDateRefundStatuses,
	customDateStatuses,
	customDateSuggestionStatuses,
	customDates,
	dateExperience,
	getUsers,
	laCities,
	locations,
	roles,
	state,
	stops,
	tastemakers,
	timesOfDay,
} from "./data"
import { PrismaClient, Tastemaker, TimeOfDay, User } from "@prisma/client"
import { DateTime } from "luxon"

async function seed() {
	// create records here
	const users = await getUsers()
	const prisma = new PrismaClient()

	await prisma.$transaction(async (tx) => {
		await tx.location.deleteMany({})
		await tx.address.deleteMany({})
		await tx.city.deleteMany({})
		await tx.country.deleteMany({})
		await tx.dateExperienceDraft.deleteMany({})
		await tx.dateExperience.deleteMany({})
		await tx.customDateStatus.deleteMany({})
		await tx.customDateRefundStatus.deleteMany({})
		await tx.customDateSuggestionStatus.deleteMany({})
		await tx.customDate.deleteMany({})
		await tx.dateStop.deleteMany({})
		await tx.tastemaker.deleteMany({})
		await tx.plannedDate.deleteMany({})
		await tx.role.deleteMany({})
		await tx.state.deleteMany({})
		await tx.user.deleteMany({})
		await tx.timeOfDay.deleteMany({})
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

		const createdTimesOfDay: TimeOfDay[] = []

		for (const timeOfDay of timesOfDay) {
			const createdTimeOfDay = await tx.timeOfDay.create({
				data: {
					name: timeOfDay,
				},
			})
			createdTimesOfDay.push(createdTimeOfDay)
		}

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
			const tastemaker = tastemakers[i] as typeof tastemakers[0]
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
		const createdDateExperience = await tx.dateExperience.create({
			data: {
				tastemakerId: tastemaker?.id as string,
				thumbnail: dateExperience.thumbnail,
				title: dateExperience.title,
				description: dateExperience.description,
				timesOfDay: {
					connect: createdTimesOfDay
						.filter((timeOfDay) => timeOfDay.name !== "Late Night")
						.map((timeOfDay) => ({
							id: timeOfDay.id,
						})),
				},
				tags: {
					connectOrCreate: dateExperience.tags.map((tag) => ({
						where: {
							name: tag,
						},
						create: {
							name: tag,
						},
					})),
				},
				stops: {
					create: stops.map((stop, i) => ({
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
									},
								},
							},
						},
					})),
				},
			},
		})
		await tx.plannedDate.create({
			data: {
				experienceId: createdDateExperience.id,
				userId: user?.id as string,
				// add 1 day to current date
				plannedTime: DateTime.now().plus({ days: 1 }).toISO() as string,
			},
		})
		const statuses = await Promise.all(
			customDateStatuses.map((status) =>
				tx.customDateStatus.create({ data: { name: status } }),
			),
		)
		for (let i = 0; i < customDates.length; i++) {
			const customDate = customDates[i] as typeof customDates[0]
			const requestor = generatedUsers[1] as User
			await tx.customDate.create({
				data: {
					...omit(customDate, "requestor", "tastemaker", "status", "tags"),
					requestorId: requestor.id as string,
					tastemakerId: generatedTastemakers[0]?.id as string,
					statusId: statuses[0]?.id as string,
					tags: {
						connectOrCreate: customDate.tags.map((tag) => ({
							where: {
								name: tag,
							},
							create: {
								name: tag,
							},
						})),
					},
				},
			})
		}
		await Promise.all(
			customDateSuggestionStatuses.map((status) =>
				tx.customDateSuggestionStatus.create({ data: { name: status } }),
			),
		)
		await Promise.all(
			customDateRefundStatuses.map((status) =>
				tx.customDateRefundStatus.create({ data: { name: status } }),
			),
		)
	})

	await prisma.$disconnect()
}

seed()
