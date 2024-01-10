import { builder } from "../builder"
import { track } from "../lib"
import { AuthError } from "./error"

builder.objectType("CategorizedDateList", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
		order: t.exposeInt("order"),
		dates: t.field({
			type: ["FreeDate"],
			resolve: async (_p, _a, { prisma }) => {
				return await prisma.freeDate.findMany({
					where: {
						lists: {
							some: {
								id: _p.id,
							},
						},
					},
				})
			},
		}),
	}),
})

export const CreateCategorizedDateListInput = builder.inputType(
	"CreateCategorizedDateListInput",
	{
		fields: (t) => ({
			title: t.string({ required: true }),
			order: t.int({ required: true }),
			dateIds: t.stringList({ required: true }),
		}),
	},
)

builder.mutationFields((t) => ({
	createCategorizedDateList: t.field({
		type: "CategorizedDateList",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: CreateCategorizedDateListInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			// check if user is logged in and is an admin
			if (!currentUser) {
				throw new AuthError(
					"You must be logged in to create a categorized date list",
				)
			}
			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
					role: {
						name: "admin",
					},
				},
			})
			if (!user) {
				throw new AuthError(
					"You are not authorized to create a categorized date list",
				)
			}
			// check if all dates exist
			const dates = await prisma.freeDate.findMany({
				where: {
					id: {
						in: input.dateIds,
					},
				},
			})
			if (dates.length !== input.dateIds.length) {
				throw new Error("Not all dates exist")
			}
			// create list
			try {
				return await prisma.categorizedDateList.create({
					data: {
						title: input.title,
						dates: {
							connect: dates.map((date) => ({ id: date.id })),
						},
						order: input.order,
					},
				})
			} catch {
				throw new Error("Could not create list")
			}
		},
	}),
}))

builder.queryFields((t) => ({
	categorizedDateLists: t.field({
		type: ["CategorizedDateList"],
		resolve: async (_p, _a, { prisma, req }) => {
			track(req, "Home Page Viewed", {})
			return await prisma.categorizedDateList.findMany({
				orderBy: {
					order: "asc",
				},
			})
		},
	}),
}))
