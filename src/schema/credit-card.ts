import { builder } from "../builder"
import { AuthError } from "./error"
import { DateTime } from "luxon"

type CreditCard = {
	cardId: string
}

// TODO: Cache these queries
export const CreditCard = builder
	.objectRef<CreditCard>("CreditCard")
	.implement({
		fields: (t) => ({
			id: t.exposeID("cardId"),
			expirationDate: t.string({
				resolve: async (p, _, { currentUser, stripe }) => {
					if (!currentUser?.stripeCustomerId) return ""
					const paymentMethod = await stripe.paymentMethods.retrieve(p.cardId)

					if (!paymentMethod) return ""
					const date = DateTime.fromObject({
						month: paymentMethod.card?.exp_month || 0,
						year: paymentMethod.card?.exp_year || 0,
					})
					return `${date.monthShort} ${paymentMethod.card?.exp_year}`
				},
			}),
			isDefault: t.boolean({
				nullable: false,
				resolve: async (p, _, { currentUser, stripe }) => {
					if (!currentUser?.stripeCustomerId) return false
					const stripeCustomer = await stripe.customers.retrieve(
						currentUser.stripeCustomerId,
					)

					if (!stripeCustomer) return false
					if (stripeCustomer.deleted) return false

					// check if this is the only card
					// make it the default if it is
					const paymentMethods = await stripe.paymentMethods.list({
						customer: currentUser.stripeCustomerId,
						type: "card",
					})

					if (paymentMethods.data.length === 1) {
						const paymentMethod = paymentMethods.data[0]
						if (!paymentMethod) return false
						await stripe.customers.update(currentUser.stripeCustomerId, {
							invoice_settings: {
								default_payment_method: paymentMethod.id,
							},
						})
						return paymentMethod.id === p.cardId
					}

					return (
						stripeCustomer.invoice_settings.default_payment_method === p.cardId
					)
				},
			}),
			lastFourDigits: t.string({
				resolve: async (p, _, { currentUser, stripe }) => {
					if (!currentUser?.stripeCustomerId) return ""
					const paymentMethod = await stripe.paymentMethods.retrieve(p.cardId)

					if (!paymentMethod) return ""

					return paymentMethod.card?.last4 || ""
				},
			}),
			brand: t.string({
				resolve: async (p, _, { currentUser, stripe }) => {
					if (!currentUser?.stripeCustomerId) return ""
					const paymentMethod = await stripe.paymentMethods.retrieve(p.cardId)

					if (!paymentMethod) return ""

					return paymentMethod.card?.brand || ""
				},
			}),
		}),
	})

type SetupIntent = {
	clientSecret: string | null
}

export const SetupIntent = builder
	.objectRef<SetupIntent>("SetupIntent")
	.implement({
		fields: (t) => ({
			clientSecret: t.exposeString("clientSecret", { nullable: true }),
		}),
	})

const CreditCardInput = builder.inputType("CreditCardInput", {
	fields: (t) => ({
		cardId: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	createSetupIntent: t.field({
		type: SetupIntent,
		errors: {
			types: [AuthError, Error],
		},
		resolve: async (_p, _a, { prisma, currentUser, stripe }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to add a card.")
			}
			try {
				if (!currentUser.stripeCustomerId) {
					// setup a new customer
					const customer = await stripe.customers.create({
						email: currentUser.email,
						name: currentUser.name,
						metadata: {
							userId: currentUser.id,
						},
					})
					await prisma.user.update({
						where: {
							id: currentUser.id,
						},
						data: {
							stripeCustomerId: customer.id,
						},
					})
					const setupIntent = await stripe.setupIntents.create({
						customer: customer.id,
						automatic_payment_methods: {
							enabled: true,
						},
					})

					return { clientSecret: setupIntent.client_secret }
				} else {
					// user already has an account.
					const customer = await stripe.customers.retrieve(
						currentUser.stripeCustomerId,
					)

					if (customer.deleted) {
						// customer was deleted, recreate it.
						const customer = await stripe.customers.create({
							email: currentUser.email,
							name: currentUser.name,
							metadata: {
								userId: currentUser.id,
							},
						})
						const setupIntent = await stripe.setupIntents.create({
							customer: customer.id,
							automatic_payment_methods: {
								enabled: true,
							},
						})

						return { clientSecret: setupIntent.client_secret }
					} else {
						// customer exists, use it.
						const setupIntent = await stripe.setupIntents.create({
							customer: customer.id,
							automatic_payment_methods: {
								enabled: true,
							},
						})
						return { clientSecret: setupIntent.client_secret }
					}
				}
			} catch {
				throw new Error("Unable to create card.")
			}
		},
	}),
	setDefaultCreditCard: t.field({
		type: CreditCard,
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: CreditCardInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser, stripe }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to add a card.")
			}
			if (!currentUser.stripeCustomerId) {
				throw new Error("You must have a card to set it as default.")
			}
			const paymentMethod = await stripe.paymentMethods.retrieve(input.cardId)

			if (!paymentMethod) {
				throw new Error("Unable to find payment method.")
			}
			try {
				await stripe.customers.update(currentUser.stripeCustomerId, {
					invoice_settings: {
						default_payment_method: paymentMethod.id,
					},
				})

				return { cardId: paymentMethod.id }
			} catch {
				throw new Error("Unable to set card as default.")
			}
		},
	}),
	removeCreditCard: t.field({
		type: CreditCard,
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: CreditCardInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser, stripe, prisma }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to remove a card.")
			}
			if (!currentUser.stripeCustomerId) {
				throw new Error("You must have a card to remove it.")
			}
			const paymentMethod = await stripe.paymentMethods.retrieve(input.cardId)

			if (!paymentMethod) {
				throw new Error("Unable to find payment method.")
			}
			const customer = await stripe.customers.retrieve(
				currentUser.stripeCustomerId,
			)
			if (!customer || customer.deleted) {
				throw new Error("Unable to find customer.")
			}

			// the card is the default card
			if (customer.invoice_settings.default_payment_method === input.cardId) {
				// get all the other cards.
				const paymentMethods = await stripe.paymentMethods.list({
					customer: currentUser.stripeCustomerId,
					type: "card",
				})

				// pick the next card as default
				// filter out the card we are removing
				const defaultPaymentMethod = paymentMethods.data
					.filter((pm) => pm.id !== input.cardId)
					.shift()

				if (defaultPaymentMethod) {
					try {
						await stripe.customers.update(currentUser.stripeCustomerId, {
							invoice_settings: {
								default_payment_method: defaultPaymentMethod.id,
							},
						})
						await stripe.paymentMethods.detach(input.cardId)

						return { cardId: paymentMethod.id }
					} catch {
						throw new Error("Unable to remove card.")
					}
				} else {
					// the user doesn't have any other cards.
					// make sure the user does not have any nonCompleted custom dates
					// otherwise throw an error
					// otherwise detach and return the card
					const customDates = await prisma.customDate.findMany({
						where: {
							requestorId: currentUser.id,
							completed: false,
						},
						select: {
							id: true,
						},
					})
					// if there are any custom dates lingering, throw an error
					if (customDates.length > 0) {
						throw new Error(
							"You still have pending payment custom dates. Please complete them before removing your card.",
						)
					} else {
						// no pending custom dates, remove the card
						try {
							await stripe.paymentMethods.detach(input.cardId)

							return { cardId: paymentMethod.id }
						} catch {
							throw new Error("Unable to remove card.")
						}
					}
				}
			} else {
				// the card is not the default card
				try {
					await stripe.paymentMethods.detach(input.cardId)

					return { cardId: paymentMethod.id }
				} catch {
					throw new Error("Unable to remove card.")
				}
			}
		},
	}),
}))
