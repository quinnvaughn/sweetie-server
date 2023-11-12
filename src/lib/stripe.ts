import { config } from "../config"
import { Stripe } from "stripe"

const stripe = new Stripe(config.STRIPE_API_KEY, {
	apiVersion: "2023-08-16",
})

export { stripe }
