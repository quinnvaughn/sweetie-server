import * as Sentry from "@sentry/node"
import { builder } from "../builder"
import { AuthError, FieldErrors } from "./error"

builder.objectType("FreeDateDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title", { nullable: true }),
		thumbnail: t.exposeString("thumbnail", { nullable: true }),
		description: t.exposeString("description", { nullable: true }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		nsfw: t.exposeBoolean("nsfw"),
		prep: t.exposeStringList("prep"),
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
		orderedStops: t.field({
			type: ["OrderedDateStopDraft"],
			resolve: async (p, _a, { prisma }) => {
				return await prisma.orderedDateStopDraft.findMany({
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

builder.objectType("OrderedDateStopDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		optional: t.exposeBoolean("optional"),
		order: t.exposeInt("order"),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		estimatedTime: t.exposeInt("estimatedTime"),
		options: t.field({
			type: ["DateStopOptionDraft"],
			resolve: async (p, _a, { prisma }) => {
				return await prisma.dateStopOptionDraft.findMany({
					where: {
						orderedDateStopId: p.id,
					},
				})
			},
		}),
	}),
})

builder.objectType("DateStopOptionDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title", { nullable: true }),
		optionOrder: t.exposeInt("optionOrder"),
		content: t.exposeString("content", { nullable: true }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		location: t.field({
			type: "Location",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				if (!p.locationId) {
					return null
				}
				return await prisma.location.findUnique({
					where: {
						id: p.locationId,
					},
				})
			},
		}),
	}),
})

const SaveLocationDraftInput = builder.inputType("SaveLocationDraftInput", {
	fields: (t) => ({
		id: t.string(),
	}),
})

const SaveOrderedDateStopDraftInput = builder.inputType(
	"SaveOrderedDateStopDraftInput",
	{
		fields: (t) => ({
			id: t.string({ required: false }),
			optional: t.boolean({ required: true }),
			order: t.int({ required: true }),
			estimatedTime: t.int({ required: true }),
			options: t.field({
				type: [SaveDateStopOptionDraftInput],
			}),
		}),
	},
)

const SaveDateStopOptionDraftInput = builder.inputType(
	"SaveDateStopOptionDraftInput",
	{
		fields: (t) => ({
			id: t.string({ required: false }),
			title: t.string(),
			content: t.string(),
			optionOrder: t.int({ required: true }),
			location: t.field({
				type: SaveLocationDraftInput,
			}),
		}),
	},
)

const DeleteFreeDateDraftInput = builder.inputType("DeleteFreeDateDraftInput", {
	fields: (t) => ({
		id: t.string({ required: true }),
	}),
})

const SaveFreeDateDraftInput = builder.inputType("SaveFreeDateDraftInput", {
	fields: (t) => ({
		draftId: t.string(),
		thumbnail: t.string(),
		title: t.string(),
		description: t.string(),
		nsfw: t.boolean(),
		recommendedTime: t.string(),
		prep: t.stringList(),
		orderedStops: t.field({
			type: [SaveOrderedDateStopDraftInput],
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
			// check to also see if the draft is owned by the user
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
				orderedStops,
				draftId,
				nsfw,
				tags,
				recommendedTime,
				prep,
			} = input

			const filteredTags = tags?.filter((tag) => tag.length > 0) ?? []
			// draft already exists, update it
			if (draftId) {
				try {
					// delete stops first, easier than updating
					if (orderedStops?.length && orderedStops.length > 0) {
						await prisma.orderedDateStopDraft.deleteMany({
							where: {
								freeDateId: draftId,
							},
						})
					}
					const draftWithTags = await prisma.freeDateDraft.findFirst({
						where: {
							id: draftId,
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
							id: draftId,
							authorId: currentUser.id,
						},
						data: {
							thumbnail,
							title,
							description,
							recommendedTime,
							nsfw: nsfw ?? false,
							prep: { set: prep ?? undefined },
							tags: {
								disconnect: draftWithTags.tags.map(({ id }) => ({ id })),
								connectOrCreate: filteredTags.map((tag) => ({
									where: {
										text: tag.toLowerCase(),
									},
									create: {
										text: tag.toLowerCase(),
									},
								})),
							},
							orderedStops: {
								create: orderedStops?.map((stop) => ({
									estimatedTime: stop.estimatedTime,
									optional: stop.optional,
									order: stop.order,
									options: {
										create: stop.options?.map((option) => ({
											title: option.title,
											content: option.content,
											optionOrder: option.optionOrder,
											location: {
												connect: option.location?.id
													? {
															id: option.location.id,
													  }
													: undefined,
											},
										})),
									},
								})),
							},
						},
					})
					return draft
				} catch (e) {
					Sentry.setUser({ id: currentUser.id, email: currentUser.email })
					Sentry.captureException(e)
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
						nsfw: nsfw ?? false,
						prep: prep ?? undefined,
						tags: {
							connectOrCreate: filteredTags.map((tag) => ({
								where: {
									text: tag.toLowerCase(),
								},
								create: {
									text: tag.toLowerCase(),
								},
							})),
						},
						orderedStops: {
							create: orderedStops?.map((stop) => ({
								estimatedTime: stop.estimatedTime,
								optional: stop.optional,
								order: stop.order,
								options: {
									create: stop.options?.map((option) => ({
										title: option.title,
										content: option.content,
										optionOrder: option.optionOrder,
										location: {
											connect: option.location?.id
												? {
														id: option.location.id,
												  }
												: undefined,
										},
									})),
								},
							})),
						},
					},
				})
				return draft
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
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
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Unable to delete draft")
			}
		},
	}),
}))
