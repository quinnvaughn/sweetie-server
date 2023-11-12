import { builder } from "../../builder"
import {
	ConnectionShape,
	connectionFromArraySlice,
	decodeCursor,
	getDefaultFirst,
} from "../../lib"
import { addConnectionFields } from "../pagination"
import { City } from "@prisma/client"

builder.objectType("City", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		nameAndState: t.string({
			resolve: async (city, _, { prisma }) => {
				const state = await prisma.state.findUniqueOrThrow({
					where: { id: city.stateId },
					select: {
						initials: true,
					},
				})
				return `${city.name}, ${state.initials}`
			},
		}),
	}),
})

export const CityConnection = builder
	.objectRef<ConnectionShape<City>>("CityConnection")
	.implement({})

addConnectionFields(CityConnection)

builder.queryField("cities", (t) =>
	t.field({
		type: CityConnection,
		args: {
			after: t.arg.string(),
			first: t.arg.int({ defaultValue: 10 }),
			text: t.arg.string({ required: true }),
			selected: t.arg.stringList(),
		},
		resolve: async (_p, { after, first, text, selected }, { prisma }) => {
			const defaultFirst = getDefaultFirst(first)
			let decodedCursor: Date | null = null
			if (after) {
				decodedCursor = decodeCursor(after)
			}

			const [cityName, stateInitials] =
				text.split(",").map((s) => s.trim()) ?? []

			const cities = await prisma.city.findMany({
				orderBy: {
					name: "asc",
				},
				take: defaultFirst + 1,
				where: {
					AND: [
						{
							name: cityName
								? {
										contains: cityName,
										mode: "insensitive",
								  }
								: undefined,
						},
						{
							state: {
								initials: stateInitials
									? { contains: stateInitials, mode: "insensitive" }
									: undefined,
							},
						},
						{
							createdAt: decodedCursor
								? {
										lt: decodedCursor,
								  }
								: undefined,
						},
						{
							id:
								selected && selected.length > 0
									? {
											notIn: selected,
									  }
									: undefined,
						},
					],
				},
			})
			const cityCount = await prisma.city.count({
				where: {
					AND: [
						{
							name: cityName
								? {
										contains: cityName,
										mode: "insensitive",
								  }
								: undefined,
						},
						{
							state: {
								initials: stateInitials
									? { contains: stateInitials, mode: "insensitive" }
									: undefined,
							},
						},
					],
				},
			})

			return connectionFromArraySlice(
				{ arraySlice: cities, totalCount: cityCount },
				{ first: defaultFirst, after },
			)
		},
	}),
)
