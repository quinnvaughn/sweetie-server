import { builder } from "../builder"
import { Tastemaker } from "@prisma/client"

type DateCreator = {
	tastemaker: Tastemaker
	numExperiences: number
}

type DateCreatorsResult = {
	creators: DateCreator[]
	averageNumOfExperiences: number
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
			numExperiences: t.exposeInt("numExperiences"),
			lastCreatedDate: t.field({
				type: "DateTime",
				resolve: async (parent, _, { prisma }) => {
					const experience = await prisma.dateExperience.findFirstOrThrow({
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
			averageNumOfExperiences: t.exposeFloat("averageNumOfExperiences"),
		}),
	})
