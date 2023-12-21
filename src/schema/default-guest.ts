import { z } from "zod"
import { builder } from "../builder"
import { track } from "../lib"
import { AuthError, FieldErrors } from "./error"

builder.objectType("DefaultGuest", {
	fields: (t) => ({
		name: t.exposeString("name", { nullable: true }),
		email: t.exposeString("email"),
	}),
})

const SetDefaultGuestInput = builder.inputType("SetDefaultGuestInput", {
	fields: (t) => ({
		name: t.string({ required: false }),
		email: t.string({ required: true }),
	}),
})

const setDefaultGuestSchema = z.object({
	name: z
		.string()
		.min(1, "Name must be at least 1 character long.")
		.max(32, "Name must be no more than 32 characters.")
		.optional(),
	email: z.string().email("Email must be valid."),
})

builder.mutationFields((t) => ({
	removeDefaultGuest: t.field({
		type: "DefaultGuest",
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_r, _a, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to remove a default guest.")
			}

			// Check if user already has a default guest
			const existingDefaultGuest = await prisma.defaultGuest.findUnique({
				where: {
					userId: currentUser.id,
				},
			})

			if (!existingDefaultGuest) {
				throw new Error("No default guest found.")
			}

			try {
				await prisma.defaultGuest.delete({
					where: {
						id: existingDefaultGuest.id,
					},
				})
				return existingDefaultGuest
			} catch {
				throw new Error("Failed to remove default guest.")
			}
		},
	}),
	setDefaultGuest: t.field({
		type: "DefaultGuest",
		errors: {
			types: [AuthError, Error, FieldErrors],
		},
		args: {
			input: t.arg({ type: SetDefaultGuestInput, required: true }),
		},
		resolve: async (_r, { input }, { prisma, currentUser, req }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to set a default guest.")
			}

			const result = setDefaultGuestSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const { data } = result

			// Check if user already has a default guest
			const existingDefaultGuest = await prisma.defaultGuest.findUnique({
				where: {
					userId: currentUser.id,
				},
			})

			if (existingDefaultGuest) {
				// Update existing default guest
				try {
					const defaultGuest = await prisma.defaultGuest.update({
						where: {
							id: existingDefaultGuest.id,
						},
						data: {
							name: data.name,
							email: data.email,
						},
					})
					track(req, "User Updated Default Guest", {})
					return defaultGuest
				} catch {
					throw new Error("Failed to update default guest.")
				}
			}

			try {
				const defaultGuest = await prisma.defaultGuest.create({
					data: {
						name: data.name,
						email: data.email,
						userId: currentUser.id,
					},
				})
				track(req, "User Added Default Guest", {})
				return defaultGuest
			} catch {
				throw new Error("Failed to create default guest.")
			}
		},
	}),
}))
