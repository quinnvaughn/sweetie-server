import { z } from "zod"
import { builder } from "../builder"
import { AuthError, FieldError, FieldErrors } from "./error"

builder.objectType("FreeDateDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title", { nullable: true }),
		thumbnail: t.exposeString("thumbnail", { nullable: true }),
		description: t.exposeString("description", { nullable: true }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		nsfw: t.exposeBoolean("nsfw"),
		recommendedTime: t.exposeString("recommendedTime", { nullable: true }),
		author: t.field({
			type: "User",
			resolve: async (p, _a, { prisma }) =>
				await prisma.user.findUniqueOrThrow({ where: { id: p.authorId } }),
		}),
		tags: t.field({
			type: ["Tag"],
			resolve: async (parent, _a, { prisma }) => {
				return await prisma.tag.findMany({
					where: {
						drafts: {
							some: {
								id: parent.id,
							},
						},
					},
				})
			},
		}),
		stops: t.field({
			type: ["DateStopDraft"],
			resolve: async (p, _a, { prisma }) => {
				return await prisma.dateStopDraft.findMany({
					where: {
						freeDateId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				})
			},
		}),
	}),
})

builder.objectType("DateStopDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title", { nullable: true }),
		content: t.exposeString("content", { nullable: true }),
		order: t.exposeInt("order"),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		estimatedTime: t.exposeInt("estimatedTime"),
		location: t.field({
			type: "Location",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				if (!p.locationId) {
					return null
				}
				return await prisma.location.findUnique({
					where: { id: p.locationId },
				})
			},
		}),
	}),
})

const SaveLocationDraftInput = builder.inputType("SaveLocationDraftInput", {
	fields: (t) => ({
		id: t.string(),
		name: t.string(),
	}),
})

const SaveDateStopDraftInput = builder.inputType("SaveDateStopDraftInput", {
	fields: (t) => ({
		title: t.string(),
		content: t.string(),
		location: t.field({
			type: SaveLocationDraftInput,
			required: true,
		}),
		order: t.int({ required: true }),
		estimatedTime: t.int(),
	}),
})

const DeleteFreeDateDraftInput = builder.inputType("DeleteFreeDateDraftInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
})

const stopsSchema = z.array(
	z.object({
		order: z.number().min(1),
	}),
)

const SaveFreeDateDraftInput = builder.inputType("SaveFreeDateDraftInput", {
	fields: (t) => ({
		id: t.string(),
		thumbnail: t.string(),
		title: t.string(),
		description: t.string(),
		nsfw: t.boolean(),
		recommendedTime: t.string(),
		stops: t.field({
			type: [SaveDateStopDraftInput],
		}),
		tags: t.stringList(),
	}),
})

builder.queryFields((t) => ({
	freeDateDraft: t.field({
		type: "FreeDateDraft",
		args: {
			id: t.arg.string({ required: true }),
		},
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_p, { id }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to find a draft")
			}
			const draft = await prisma.freeDateDraft.findFirst({
				where: {
					id,
					authorId: currentUser.id,
				},
			})
			if (!draft) {
				throw new Error("Unable to find draft")
			}

			return draft
		},
	}),
}))

builder.mutationFields((t) => ({
	saveFreeDateDraft: t.field({
		type: "FreeDateDraft",
		args: {
			input: t.arg({ type: SaveFreeDateDraftInput, required: true }),
		},
		errors: {
			types: [AuthError, FieldErrors, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to save a draft")
			}

			const {
				thumbnail,
				title,
				description,
				stops,
				id,
				nsfw,
				tags,
				recommendedTime,
			} = input

			const filteredTags = tags?.filter((tag) => tag.length > 0) ?? []

			// validate stops as they need an order.
			const stopsValidation = stopsSchema.safeParse(stops)

			if (!stopsValidation.success) {
				throw new FieldErrors([
					new FieldError("stops", "Stops must have an order"),
				])
			}

			if (id) {
				try {
					// delete stops first, easier than updating
					if (stops?.length && stops.length > 0) {
						await prisma.dateStopDraft.deleteMany({
							where: {
								freeDateId: id,
							},
						})
					}
					const draftWithTags = await prisma.freeDateDraft.findFirst({
						where: {
							id,
							authorId: currentUser.id,
						},
						include: {
							tags: true,
						},
					})
					if (!draftWithTags) {
						throw new Error("Unable to find draft")
					}

					const draft = await prisma.freeDateDraft.update({
						where: {
							id,
							authorId: currentUser.id,
						},
						data: {
							thumbnail,
							title,
							description,
							recommendedTime,
							nsfw: nsfw ?? false,
							tags: {
								disconnect: draftWithTags.tags.map(({ id }) => ({ id })),
								connectOrCreate: filteredTags.map((tag) => ({
									where: {
										name: tag.toLowerCase(),
									},
									create: {
										name: tag.toLowerCase(),
									},
								})),
							},
							stops:
								stops?.length && stops.length > 0
									? {
											create: stops.map((stop) => ({
												title: stop.title,
												content: stop.content,
												estimatedTime: stop.estimatedTime ?? undefined,
												locationId:
													stop.location.id && stop.location.id.length > 0
														? stop.location.id
														: undefined,
												order: stop.order,
											})),
									  }
									: undefined,
						},
					})
					return draft
				} catch {
					throw new Error("Unable to save draft")
				}
			}

			try {
				const draft = await prisma.freeDateDraft.create({
					data: {
						authorId: currentUser.id,
						thumbnail,
						title,
						description,
						recommendedTime,
						stops:
							stops?.length && stops.length > 0
								? {
										create: stops.map((stop) => ({
											title: stop.title,
											content: stop.content,
											estimatedTime: stop.estimatedTime ?? undefined,
											locationId:
												stop.location.id && stop.location.id.length > 0
													? stop.location.id
													: undefined,
											order: stop.order,
										})),
								  }
								: undefined,
					},
				})
				return draft
			} catch {
				throw new Error("Unable to save draft")
			}
		},
	}),
	deleteFreeDateDraft: t.field({
		type: "FreeDateDraft",
		args: {
			input: t.arg({ type: DeleteFreeDateDraftInput, required: true }),
		},
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to delete a draft")
			}
			const { id } = input
			const draft = await prisma.freeDateDraft.findFirst({
				where: {
					id,
					authorId: currentUser.id,
				},
			})

			if (!draft) {
				throw new Error("Unable to find draft")
			}

			try {
				await prisma.freeDateDraft.delete({
					where: {
						id,
					},
				})
				return draft
			} catch {
				throw new Error("Unable to delete draft")
			}
		},
	}),
}))
