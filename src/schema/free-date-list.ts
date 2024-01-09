import { builder } from "../builder"
import { AuthError } from "./error"

builder.objectType("FreeDateList", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title"),
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

export const CreateFreeDateListInput = builder.inputType(
	"CreateFreeDateListInput",
	{
		fields: (t) => ({
			title: t.string({ required: true }),
			dateIds: t.stringList({ required: true }),
		}),
	},
)

builder.mutationFields((t) => ({
	createFreeDateList: t.field({
		type: "FreeDateList",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: CreateFreeDateListInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			// check if user is logged in and is an admin
			if (!currentUser) {
				throw new AuthError("You must be logged in to create a free date list")
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
				throw new AuthError("You are not authorized to create a free date list")
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
				return await prisma.freeDateList.create({
					data: {
						title: input.title,
						dates: {
							connect: dates.map((date) => ({ id: date.id })),
						},
					},
				})
			} catch {
				throw new Error("Could not create list")
			}
		},
	}),
}))
