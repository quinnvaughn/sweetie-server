import { builder } from "../builder"
import {
	AuthError,
	EntityCreationError,
	EntityDeletionError,
	EntityNotFoundError,
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

const SaveDateStopDraftInput = builder.inputType("SaveDateStopDraftInput", {
	fields: (t) => ({
		title: t.string(),
		content: t.string(),
		locationId: t.string(),
		order: t.int({ required: true }),
	}),
})

const DeleteDateExperienceDraftInput = builder.inputType(
	"DeleteDateExperienceDraftInput",
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

const SaveDateExperienceDraftInput = builder.inputType(
	"SaveDateExperienceDraftInput",
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
	dateExperienceDraft: t.field({
		type: "DateExperienceDraft",
		args: {
			id: t.arg.string({ required: true }),
		},
		errors: {
			types: [AuthError, EntityNotFoundError],
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
				throw new EntityNotFoundError("Date experience draft")
			}

			return draft
		},
	}),
}))

builder.mutationFields((t) => ({
	saveDateExperienceDraft: t.field({
		type: "DateExperienceDraft",
		args: {
			input: t.arg({ type: SaveDateExperienceDraftInput, required: true }),
		},
		errors: {
			types: [AuthError, FieldErrors, EntityCreationError, EntityNotFoundError],
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to save a draft")
			}

			const {
				thumbnail,
				timesOfDay,
				title,
				description,
				stops,
				id,
				nsfw,
				tags,
			} = input

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
						throw new EntityNotFoundError("Draft")
					}
					const draft = await prisma.dateExperienceDraft.update({
						where: {
							id,
						},
						data: {
							authorId: currentUser.id,
							thumbnail,
							title,
							description,
							nsfw: nsfw ?? false,
							timesOfDay: timesOfDay
								? {
										disconnect: timesOfDay
											? draftWithTodAndTags.timesOfDay.map(({ id }) => ({ id }))
											: undefined,
										connect: timesOfDay.map((timeOfDay) => ({
											name: timeOfDay,
										})),
								  }
								: undefined,
							tags: tags
								? {
										disconnect: tags
											? draftWithTodAndTags.tags.map(({ id }) => ({ id }))
											: undefined,
										connect: tags.map((tag) => ({
											name: tag,
										})),
								  }
								: undefined,
							stops:
								stops?.length && stops.length > 0
									? {
											create: stops.map((stop) => ({
												title: stop.title,
												content: stop.content,
												locationId: stop.locationId,
												order: stop.order,
											})),
									  }
									: undefined,
						},
					})
					return draft
				} catch {
					throw new EntityCreationError("draft")
				}
			}

			try {
				const draft = await prisma.dateExperienceDraft.create({
					data: {
						authorId: currentUser.id,
						thumbnail,
						title,
						description,
						timesOfDay:
							timesOfDay?.length && timesOfDay.length > 0
								? {
										connect: timesOfDay.map((timeOfDay) => ({
											name: timeOfDay,
										})),
								  }
								: undefined,
						stops:
							stops?.length && stops.length > 0
								? {
										create: stops.map((stop) => ({
											title: stop.title,
											content: stop.content,
											locationId:
												stop.locationId === "" ? undefined : stop.locationId,
											order: stop.order,
										})),
								  }
								: undefined,
					},
				})
				return draft
			} catch {
				throw new EntityCreationError("Unable to save draft")
			}
		},
	}),
	deleteDateExperienceDraft: t.field({
		type: "DateExperienceDraft",
		args: {
			input: t.arg({ type: DeleteDateExperienceDraftInput, required: true }),
		},
		errors: {
			types: [AuthError, EntityNotFoundError, EntityDeletionError],
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
				throw new EntityNotFoundError("Draft")
			}

			try {
				await prisma.dateExperienceDraft.delete({
					where: {
						id,
					},
				})
				return draft
			} catch {
				throw new EntityDeletionError("draft")
			}
		},
	}),
}))
