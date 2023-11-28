import { builder } from "../builder"
import { doesURLExist } from "../lib"
import { AuthError, FieldError, FieldErrors } from "./error"
import { z } from "zod"

builder.objectType("UserProfile", {
	fields: (t) => ({
		id: t.exposeID("id"),
		bio: t.exposeString("bio", { nullable: true }),
		avatar: t.exposeString("avatar", { nullable: true }),
		link: t.exposeString("link", { nullable: true }),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
	}),
})

const UpdateUserProfileInput = builder.inputType("UpdateUserProfileInput", {
	fields: (t) => ({
		bio: t.string({ required: false }),
		username: t.string({ required: false }),
		link: t.string({ required: false }),
		name: t.string({ required: false }),
		avatar: t.string({ required: false }),
		email: t.string({ required: false }),
	}),
})

export const updateUserProfileSchema = z.object({
	avatar: z.string().optional().or(z.literal("")),
	link: z
		.string()
		.refine(
			async (url) => {
				let updatedURL = url
				const hasHttp = url.startsWith("http://") || url.startsWith("https://")
				if (!hasHttp) {
					updatedURL = `http://${url}`
				}
				try {
					return await doesURLExist(updatedURL)
				} catch {
					return false
				}
			},
			{ message: "Must be a valid URL" },
		)
		.transform((url) => {
			const hasHttp = url.startsWith("http://") || url.startsWith("https://")
			if (!hasHttp) {
				return `http://${url}`
			}
			return url
		})
		.optional()
		.or(z.literal("")),
	bio: z
		.string()
		.max(280, "Bio must be at most 280 characters long")
		.optional(),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters long")
		.max(15, "Username must be at most 15 characters long")
		.regex(
			new RegExp("^[a-zA-Z0-9_]+$"),
			"Username must only contain letters, numbers, and underscores",
		)
		.optional(),
	name: z
		.string()
		.min(1, "Name must be at least 1 character long")
		.max(32, "Name must be at most 32 characters long")
		.optional(),
	email: z.string().email("Must be a valid email").optional(),
})

builder.mutationFields((t) => ({
	updateUserProfile: t.field({
		// we return this because we are updating token
		// information ie username and we need to return the new token
		type: 'User',
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({ type: UpdateUserProfileInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, currentUser, req }) => {
			if (!currentUser)
				throw new AuthError("You must be logged in to update your profile")
			const result = await updateUserProfileSchema.safeParseAsync(input)

			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const userProfile = await prisma.userProfile.findUnique({
				where: { userId: currentUser.id },
			})
			const { username, bio, name, avatar, link, email } = result.data
			if (bio !== undefined) {
				if (!userProfile) {
					try {
						await prisma.userProfile.create({
							data: { bio, userId: currentUser.id },
						})
					} catch {
						throw new Error("Unable to create user profile")
					}
				} else {
					try {
						await prisma.userProfile.update({
							where: { id: userProfile.id },
							data: {
								bio,
							},
						})
					} catch {
						throw new Error("Unable to update user profile")
					}
				}
			}

			if (link !== undefined) {
				if (!userProfile) {
					try {
						await prisma.userProfile.create({
							data: { link, userId: currentUser.id },
						})
					} catch {
						throw new Error("Unable to update user profile")
					}
				} else {
					try {
						await prisma.userProfile.update({
							where: { id: userProfile.id },
							data: {
								link,
							},
						})
					} catch {
						throw new Error("Unable to up")
					}
				}
			}

			if (avatar !== undefined) {
				if (!userProfile) {
					try {
						await prisma.userProfile.create({
							data: { avatar, userId: currentUser.id },
						})
					} catch {
						throw new Error("Unable to up")
					}
				} else {
					try {
						// if avatar is empty string, set to null
						await prisma.userProfile.update({
							where: { id: userProfile.id },
							data: {
								avatar: avatar === "" ? null : avatar,
							},
						})
					} catch {
						throw new Error("Unable to up")
					}
				}
			}

			if (username !== undefined) {
				const existingUser = await prisma.user.findFirst({
					where: {
						id: {
							not: currentUser.id,
						},
						username: {
							equals: username,
							mode: "insensitive",
						},
					},
				})
				if (existingUser) {
					throw new FieldErrors([
						new FieldError("username", "Username is taken"),
					])
				}
				try {
					await prisma.user.update({
						where: { id: currentUser.id },
						data: { username },
					})
				} catch {
					throw new Error("Unable to up")
				}
			}
			if (name !== undefined) {
				try {
					await prisma.user.update({
						where: { id: currentUser.id },
						data: { name },
					})
				} catch {
					throw new Error("Unable to up")
				}
			}
			if (email !== undefined) {
				const existingUser = await prisma.user.findFirst({
					where: {
						id: {
							not: currentUser.id,
						},
						email: {
							equals: email,
							mode: "insensitive",
						},
					},
				})
				if (existingUser) {
					throw new FieldErrors([new FieldError("email", "Email is taken")])
				}
				try {
					await prisma.user.update({
						where: { id: currentUser.id },
						data: { email },
					})
				} catch {
					throw new Error("Unable to up")
				}
			}
			const user = await prisma.user.findUnique({
				where: { id: currentUser.id },
				include: { role: true },
			})
			if (!user) {
				throw new Error("Unable to up")
			}

			req.session.userId = user.id

			return user 
		},
	}),
}))
