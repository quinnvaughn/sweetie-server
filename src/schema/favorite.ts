import { builder } from "../builder"
import { track } from "../lib"
import { AuthError } from "./error"

builder.objectType("Favorite", {
	fields: (t) => ({
		user: t.field({
			type: "User",
			nullable: false,
			resolve: (parent, _, { prisma }) => {
				return prisma.user.findUniqueOrThrow({
					where: { id: parent.userId },
				})
			},
		}),
		freeDate: t.field({
			type: "FreeDate",
			nullable: false,
			resolve: async (parent, _, { prisma }) => {
				return await prisma.freeDate.findUniqueOrThrow({
					where: { id: parent.freeDateId },
				})
			},
		}),
	}),
})

const ToggleFavoriteInput = builder.inputType("ToggleFavoriteInput", {
	fields: (t) => ({
		freeDateId: t.string({ required: true }),
	}),
})

class ToggleFavoriteResult {
	type: "removed" | "saved"
}

builder.objectType(ToggleFavoriteResult, {
	name: "ToggleFavoriteResult",
	fields: (t) => ({
		type: t.exposeString("type"),
	}),
})

builder.mutationFields((t) => ({
	toggleFavorite: t.field({
		type: ToggleFavoriteResult,
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: ToggleFavoriteInput, required: true }),
		},
		resolve: async (_, { input }, { prisma, currentUser, req }) => {
			if (!currentUser)
				throw new AuthError("You must be logged in to favorite a date")
			const userId = currentUser.id
			const freeDateId = input.freeDateId
			const favorite = await prisma.favorite.findUnique({
				where: { userId_freeDateId: { userId, freeDateId } },
			})
			try {
				if (favorite) {
					await prisma.favorite.delete({
						where: { userId_freeDateId: { userId, freeDateId } },
					})
					return { type: "removed" as const }
				}
				await prisma.favorite.create({
					data: {
						user: { connect: { id: userId } },
						freeDate: { connect: { id: freeDateId } },
					},
				})
				track(req, "User Favorited Date", {
					user_id: userId,
					date_id: freeDateId,
				})
				return { type: "saved" as const }
			} catch {
				throw new Error("Unable to favorite date")
			}
		},
	}),
}))
