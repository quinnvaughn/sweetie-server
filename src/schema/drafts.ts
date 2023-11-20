import { builder } from "../builder"
import {
	AuthError,
	FieldError,
	FieldErrors,
} from "./error"
import { z } from "zod"

builder.objectType("DateExperienceDraft", {
	fields: (t) => ({
		id: t.exposeID("id"),
		title: t.exposeString("title", { nullable: true }),
		thumbnail: t.exposeString("thumbnail", { nullable: true }),
		description: t.exposeString("description", { nullable: true }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		nsfw: t.exposeBoolean("nsfw"),
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
						experienceId: p.id,
					},
					orderBy: {
						order: "asc",
					},
				})
			},
		}),
		timesOfDay: t.field({
			type: ["TimeOfDay"],
			resolve: async (p, _a, { prisma }) =>
				await prisma.timeOfDay.findMany({
					where: {
						drafts: {
							some: {
								id: p.id,
							},
						},
					},
				}),
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
	}),
})

const DeleteFreeDateDraftInput = builder.inputType(
	"DeleteFreeDateDraftInput",
	{
		fields: (t) => ({
			id: t.string({ required: true }),
		}),
	},
)

const stopsSchema = z.array(
	z.object({
		order: z.number().min(1),
	}),
)

const SaveFreeDateDraftInput = builder.inputType(
	"SaveFreeDateDraftInput",
	{
		fields: (t) => ({
			id: t.string(),
			thumbnail: t.string(),
			title: t.string(),
			description: t.string(),
			timesOfDay: t.stringList(),
			nsfw: t.boolean(),
			stops: t.field({
				type: [SaveDateStopDraftInput],
			}),
			tags: t.stringList(),
		}),
	},
)

builder.queryFields((t) => ({
	freeDateDraft: t.field({
		type: "DateExperienceDraft",
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
			const draft = await prisma.dateExperienceDraft.findFirst({
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
		type: "DateExperienceDraft",
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
				timesOfDay: oldTimesOfDay,
				title,
				description,
				stops,
				id,
				nsfw,
				tags,
			} = input

			const filteredTags = tags?.filter((tag) => tag.length > 0) ?? []

			// validate stops as they need an order.
			const stopsValidation = stopsSchema.safeParse(stops)

			if (!stopsValidation.success) {
				throw new FieldErrors([
					new FieldError("stops", "Stops must have an order"),
				])
			}

			const timesOfDay = await prisma.timeOfDay.findMany({
				where: {
					name: {
						in: oldTimesOfDay ?? [],
						mode: "insensitive",
					},
				},
			})

			if (id) {
				try {
					// delete stops first, easier than updating
					if (stops?.length && stops.length > 0) {
						await prisma.dateStopDraft.deleteMany({
							where: {
								experienceId: id,
							},
						})
					}
					const draftWithTodAndTags =
						await prisma.dateExperienceDraft.findFirst({
							where: {
								id,
								authorId: currentUser.id,
							},
							include: {
								timesOfDay: true,
								tags: true,
							},
						})
					if (!draftWithTodAndTags) {
						throw new Error("Unable to find draft")
					}
					
					const draft = await prisma.dateExperienceDraft.update({
						where: {
							id,
							authorId: currentUser.id,
						},
						data: {
							thumbnail,
							title,
							description,
							nsfw: nsfw ?? false,
							timesOfDay: timesOfDay
								? {
										disconnect: timesOfDay
											? draftWithTodAndTags.timesOfDay.map(({ id }) => ({ id }))
											: undefined,
												connect: timesOfDay.map(({ id }) => ({ id })),
								  }
								: undefined,
							tags: {
								disconnect: draftWithTodAndTags.tags.map(({ id }) => ({ id })),
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
												locationId: stop.location.id && stop.location.id.length > 0  ? stop.location.id  : undefined,
												order: stop.order,
											})),
									  }
									: undefined,
						},
					})
					return draft
				} catch (e) {
					console.error(e)
					throw new Error("Unable to save draft")
				}
			}

			try {
				const draft = await prisma.dateExperienceDraft.create({
					data: {
						authorId: currentUser.id,
						thumbnail,
						title,
						description,
						timesOfDay: {
							connect: timesOfDay.map(({ id }) => ({ id })),
						},
						stops:
							stops?.length && stops.length > 0
								? {
										create: stops.map((stop) => ({
											title: stop.title,
											content: stop.content,
											locationId: stop.location.id && stop.location.id.length > 0  ? stop.location.id  : undefined,
											order: stop.order,
										})),
								  }
								: undefined,
					},
				})
				return draft
			} catch  {
				throw new Error("Unable to save draft")
			}
		},
	}),
	deleteFreeDateDraft: t.field({
		type: "DateExperienceDraft",
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
			const draft = await prisma.dateExperienceDraft.findFirst({
				where: {
					id,
					authorId: currentUser.id,
				},
			})

			if (!draft) {
				throw new Error("Unable to find draft")
			}

			try {
				await prisma.dateExperienceDraft.delete({
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
