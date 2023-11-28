import { builder } from "../builder"
import { Tastemaker } from "@prisma/client"

type DateCreator = {
	tastemaker: Tastemaker
	numFreeDates: number
}

type DateCreatorsResult = {
	creators: DateCreator[]
	averageNumOfFreeDates: number
}

export const DateCreator = builder
	.objectRef<DateCreator>("DateCreator")
	.implement({
		fields: (t) => ({
			tastemaker: t.field({
				type: "Tastemaker",
				resolve: async (parent, _, { prisma }) => {
					return await prisma.tastemaker.findUniqueOrThrow({
						where: {
							id: parent.tastemaker.id,
						},
					})
				},
			}),
			numFreeDates: t.exposeInt("numFreeDates"),
			lastCreatedDate: t.field({
				type: "DateTime",
				resolve: async (parent, _, { prisma }) => {
					const experience = await prisma.freeDate.findFirstOrThrow({
						where: {
							tastemakerId: parent.tastemaker.id,
						},
						orderBy: {
							createdAt: "desc",
						},
					})

					return experience?.createdAt
				},
			}),
		}),
	})

export const DateCreatorsResult = builder
	.objectRef<DateCreatorsResult>("DateCreatorsResult")
	.implement({
		fields: (t) => ({
			creators: t.field({
				type: [DateCreator],
				resolve: (parent) => parent.creators,
			}),
			averageNumOfFreeDates: t.exposeFloat("averageNumOfFreeDates"),
		}),
	})
