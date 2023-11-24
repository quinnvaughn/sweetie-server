import { TypesWithDefaults, builder } from "../builder"
import {
	comparePassword,
	encryptPassword,
	generatePasswordResetToken,
	generateUsernameString,
	sendRequestPasswordResetEmail,
	verifyPasswordResetToken,
} from "../lib"
import { CreditCard } from "./credit-card"
import {
	AlreadyLoggedInError,
	AuthError,
	EntityCreationError,
	EntityNotFoundError,
	FieldError,
	FieldErrors,
} from "./error"
import { InputFieldBuilder } from "@pothos/core"
import { z } from "zod"

builder.objectType("User", {
	fields: (t) => ({
		id: t.exposeID("id"),
		email: t.exposeString("email"),
		username: t.exposeString("username"),
		name: t.exposeString("name"),
		createdAt: t.expose("createdAt", { type: "DateTime" }),
		updatedAt: t.expose("updatedAt", { type: "DateTime" }),
		role: t.field({
			type: "Role",
			resolve: async (p, _a, { prisma }) =>
				await prisma.role.findUniqueOrThrow({ where: { id: p.roleId } }),
		}),
		hasCreatedADate: t.boolean({
			resolve: async (p, _a, { prisma }) => {
				const numDates = await prisma.dateExperience.count({
					where: {
						tastemaker: {
							userId: p.id,
						},
					},
				})
				return numDates > 0
			},
		}),
		hasDefaultCreditCardOnFile: t.boolean({
			resolve: async (_p, _a, { currentUser, stripe }) => {
				if (!currentUser) return false
				if (!currentUser.stripeCustomerId) return false
				try {
					const stripeCustomer = await stripe.customers.retrieve(
						currentUser.stripeCustomerId,
					)

					if (!stripeCustomer) return false

					if (stripeCustomer.deleted) return false

					return Boolean(stripeCustomer.invoice_settings.default_payment_method)
				} catch {
					return false
				}
			},
		}),
		drafts: t.field({
			type: ["DateExperienceDraft"],
			resolve: async (p, _a, { prisma }) =>
				await prisma.dateExperienceDraft.findMany({
					where: { authorId: p.id },
					orderBy: {
						updatedAt: "desc",
					},
				}),
		}),
		profile: t.field({
			type: "UserProfile",
			nullable: true,
			resolve: async (p, _a, { prisma }) =>
				await prisma.userProfile.findUnique({ where: { userId: p.id } }),
		}),
		isUsersProfile: t.field({
			type: "Boolean",
			resolve: async (p, _a, { currentUser }) => {
				if (!currentUser) return false
				return p.id === currentUser.id
			},
		}),
		isUserADateCreator: t.field({
			type: "Boolean",
			resolve: async (p, _, { prisma }) => {
				const tastemaker = await prisma.tastemaker.findFirst({
					where: {
						userId: p.id,
						isSetup: true,
					},
				})
				return Boolean(tastemaker)
			},
		}),
		tastemaker: t.field({
			type: "Tastemaker",
			nullable: true,
			resolve: async (p, _a, { prisma }) => {
				return await prisma.tastemaker.findUnique({
					where: {
						userId: p.id,
					},
				})
			},
		}),
		creditCards: t.field({
			type: [CreditCard],
			resolve: async (p, _a, { currentUser, stripe }) => {
				// only allow users to see their own credit cards
				if (currentUser?.id !== p.id) return []
				if (!currentUser.stripeCustomerId) return []
				try {
					const stripeCustomer = await stripe.customers.retrieve(
						currentUser.stripeCustomerId,
					)

					if (!stripeCustomer) return []

					if (stripeCustomer.deleted) return []

					const paymentMethods = await stripe.paymentMethods.list({
						customer: currentUser.stripeCustomerId,
						type: "card",
					})

					if (!paymentMethods) return []

					return paymentMethods.data
						.sort((a, b) => {
							if (
								a.id === stripeCustomer.invoice_settings.default_payment_method
							) {
								return -1
							}
							if (
								b.id === stripeCustomer.invoice_settings.default_payment_method
							) {
								return 1
							}
							return 0
						})
						.map((paymentMethod) => ({
							cardId: paymentMethod.id,
						}))
				} catch {
					return []
				}
			},
		}),
	}),
})



function createAuthInputs(
	t: InputFieldBuilder<TypesWithDefaults, "InputObject">,
) {
	return {
		email: t.string({ required: true }),
		password: t.string({ required: true }),
	}
}

const RegisterInput = builder.inputType("RegisterInput", {
	fields: (t) => ({
		...createAuthInputs(t),
		name: t.string({ required: true }),
	}),
})

const LoginInput = builder.inputType("LoginInput", {
	fields: (t) => ({
		...createAuthInputs(t),
	}),
})

const UpdatePasswordInput = builder.inputType("UpdatePasswordInput", {
	fields: (t) => ({
		currentPassword: t.string({ required: true }),
		newPassword: t.string({ required: true }),
	}),
})

const loginSchema = z.object({
	email: z.string().email("Email must be valid."),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters.")
		.max(128, "Password must be no more than 128 characters."),
})

const registerSchema = z.object({
	email: loginSchema.shape.email,
	password: loginSchema.shape.password,
	name: z
		.string()
		.min(1, "Name must be at least 1 character long.")
		.max(32, "Name must be no more than 32 characters."),
})

const updatePasswordSchema = z.object({
	currentPassword: z
		.string()
		.min(6, "Password must be at least 6 characters long"),
	newPassword: z.string().min(6, "Password must be at least 6 characters long"),
})

type RequestPasswordResetResponse = {
	email: string
}

const RequestPasswordResetResponse = builder
	.objectRef<RequestPasswordResetResponse>("RequestPasswordResetResponse")
	.implement({
		fields: (t) => ({
			email: t.exposeString("email"),
		}),
	})

const RequestPasswordResetInput = builder.inputType(
	"RequestPasswordResetInput",
	{
		fields: (t) => ({
			email: t.string({ required: true }),
		}),
	},
)

const ResetPasswordInput = builder.inputType("ResetPasswordInput", {
	fields: (t) => ({
		password: t.string({ required: true }),
		token: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	logout: t.boolean({
		errors: {
			directResult: false,
			types: [AuthError, Error]
		},
		resolve: async (_r, _a, { req }) => { 
			if (!req.session.userId) {
				throw new AuthError("You must be logged in to logout.")
			}
			try {
				return new Promise<boolean>((res, rej) => {
					req.session.destroy((err) => {
						if (err) {
							rej(err)
						}
						res(true)
					})
				})
			} catch {
				throw new Error("Failed to logout.")
			}
		}
	}),
	login: t.field({
		type: 'User',
		errors: {
			types: [FieldErrors, AlreadyLoggedInError],
		},
		args: {
			input: t.arg({ type: LoginInput, required: true }),
		},
		resolve: async (_r, { input }, { prisma, currentUser, req }) => {
			const result = loginSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const { data } = result

			if (currentUser) {
				throw new AlreadyLoggedInError()
			}

			const user = await prisma.user.findUnique({
				where: {
					email: data.email.toLowerCase(),
				},
				include: {
					role: true,
				},
			})

			if (!user || !user.role.name) {
				throw new FieldErrors([new FieldError("email", "Email or password is incorrect.")])
			}

			const passwordMatch = comparePassword(data.password, user.password)

			if (!passwordMatch) {
				throw new FieldErrors([new FieldError("email", "Email or password is incorrect.")])
			}

			console.log({ session: req.session })
			console.log({id: user.id})

			req.session.userId = user.id

			return user
		},
	}),
	register: t.field({
		type: 'User',
		errors: {
			types: [FieldErrors, AlreadyLoggedInError, EntityCreationError],
		},
		args: {
			input: t.arg({ type: RegisterInput, required: true }),
		},
		resolve: async (_r, { input }, { prisma, currentUser, req }) => {
			const result = registerSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const { data } = result

			if (currentUser) {
				throw new AlreadyLoggedInError()
			}
			const lowercaseEmail = data.email.toLowerCase()

			const userAlreadyExists = await prisma.user.findFirst({
				where: {
					email: lowercaseEmail,
				},
			})

			if (userAlreadyExists) {
				throw new FieldErrors([
					new FieldError("email", "Email is already in use."),
				])
			}
			const role = await prisma.role.findUnique({ where: { name: "user" } })

			if (!role) {
				throw new EntityCreationError("user")
			}

			/**
			 * keep generating username until it's unique
			 * We aren't having users set their own username on the auth flow,
			 * so we just generate one for them
			 */
			let username = `user${generateUsernameString(8)}`
			while (await prisma.user.findUnique({ where: { username } })) {
				username = `user${generateUsernameString(8)}`
			}
			try {
				const user = await prisma.user.create({
					data: {
						email: lowercaseEmail,
						password: encryptPassword(data.password),
						name: data.name,
						username,
						role: {
							connect: {
								id: role.id,
							},
						},
						// everyone gets a tastemaker profile. it's just not setup
						tastemaker: {
							create: {},
						},
					},
				})
				req.session.userId = user.id

				return user 
			} catch {
				throw new EntityCreationError("user")
			}
		},
	}),
	updatePassword: t.field({
		type: "User",
		args: {
			input: t.arg({ type: UpdatePasswordInput, required: true }),
		},
		errors: {
			types: [AuthError, FieldErrors, Error],
		},
		async resolve(_p, { input }, { currentUser, prisma }) {
			if (!currentUser) {
				throw new AuthError("You must be logged in to update your password.")
			}

			const result = updatePasswordSchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}

			const { data } = result

			const user = await prisma.user.findUnique({
				where: {
					id: currentUser.id,
				},
			})

			if (!user) {
				throw new Error("User not found.")
			}

			const passwordMatch = comparePassword(data.currentPassword, user.password)

			if (!passwordMatch) {
				throw new FieldErrors([
					new FieldError("currentPassword", "Current password is incorrect."),
				])
			}

			const newPassword = encryptPassword(data.newPassword)

			try {
				return await prisma.user.update({
					where: {
						id: currentUser.id,
					},
					data: {
						password: newPassword,
					},
				})
			} catch {
				throw new Error("Failed to update password.")
			}
		},
	}),
	requestPasswordReset: t.field({
		type: RequestPasswordResetResponse,
		errors: {
			types: [FieldErrors, Error],
		},
		args: {
			input: t.arg({ type: RequestPasswordResetInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma }) => {
			const user = await prisma.user.findUnique({
				where: { email: input.email },
			})
			if (!user) {
				throw new FieldErrors([new FieldError("email", "Email not found")])
			}
			
			try {
				const token = generatePasswordResetToken(user.id)
				await prisma.user.update({
					where: {
						id: user.id,
					},
					data: {
						resetToken: token,
					},
				})
				await sendRequestPasswordResetEmail(user.email, token)
			} catch {
				throw new Error("Failed to send email")
			}

			return { email: user.email }
		},
	}),
	resetPassword: t.field({
		type: 'User',
		errors: {
			types: [Error],
		},
		args: {
			input: t.arg({ type: ResetPasswordInput, required: true }),
		},
		resolve: async (_p, { input }, { prisma, req}) => {
			const { token, password } = input
			const verifiedToken = verifyPasswordResetToken(token)

			if (!verifiedToken) {
				throw new Error("Invalid token")
			}

			const { id } = verifiedToken

			const user = await prisma.user.findUnique({
				where: { id },
			})

			if (!user) {
				throw new Error("User does not exist")
			}

			if (user.resetToken !== token) {
				throw new Error("Invalid token")
			}

			const newPassword = encryptPassword(password)

			try {
				const user = await prisma.user.update({
					where: {
						id,
					},
					data: {
						password: newPassword,
						resetToken: null,
					},
					include: {
						role: {
							select: {
								name: true,
							},
						},
					},
				})
				req.session.userId = user.id

				return user
			} catch {
				throw new Error("Failed to update password.")
			}
		},
	}),
}))

builder.queryFields((t) => ({
	viewer: t.field({
		type: "User",
		nullable: true,
		resolve: (_r, _a, { currentUser }) => currentUser,
	}),
	user: t.field({
		type: "User",
		errors: {
			types: [EntityNotFoundError],
		},
		args: {
			username: t.arg.string({ required: true }),
		},
		resolve: async (_r, { username }, { prisma }) => {
			const user = await prisma.user.findFirst({
				where: {
					username: {
						equals: username,
						mode: "insensitive",
					},
				},
			})
			if (!user) {
				throw new EntityNotFoundError("User")
			}
			return user
		},
	}),
}))
