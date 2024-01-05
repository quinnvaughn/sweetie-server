import { AddressValidationClient } from "@googlemaps/addressvalidation"
import axios from "axios"
import { config } from "../config"

const private_key = config.GOOGLE_CREDENTIALS_PRIVATE_KEY.replace(/\\n/gm, "\n")

// Instantiates a client
const addressvalidationClient = new AddressValidationClient({
	credentials: {
		private_key,
		client_email: config.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
	},
	projectId: config.GOOGLE_CLOUD_PROJECT_ID,
})

type CreatedLocation = {
	address: {
		street: string
		city: string
		state: string
		postalCode: string
	}
	website?: string
}

// We return strings because we want to want to do the work for the field errors.
type CreatedLocationError = {
	validatedWebsite?: string | null
	validatedAddress: string | null
}

type OptionFlags<T> = {
	[K in keyof T]: string | null
}

const addressWrongString = "Some part of this address is not valid."

const websiteWrongString = "Website is not valid."

async function validateCreatedLocation({ address, website }: CreatedLocation) {
	// TODO: Check if location with different name exists at same address
	const returnValue: OptionFlags<CreatedLocationError> = {
		validatedWebsite: null,
		validatedAddress: null,
	}
	try {
		// check if location is valid with google maps api
		const response = await addressvalidationClient.validateAddress({
			address: {
				locality: address.city,
				postalCode: address.postalCode,
				administrativeArea: address.state,
				addressLines: [address.street],
			},
		})
		if (response[0].result?.verdict?.hasUnconfirmedComponents === true) {
			// TODO: Improve this error message
			returnValue.validatedAddress = addressWrongString
		}
	} catch {
		returnValue.validatedAddress = addressWrongString
	}
	// check if website is valid
	if (website) {
		try {
			const doesExist = await doesURLExist(website)

			if (!doesExist) {
				returnValue.validatedWebsite = websiteWrongString
			}
		} catch {
			returnValue.validatedWebsite = websiteWrongString
		}
	}

	return returnValue
}

async function doesURLExist(url: string) {
	const response = await axios.get(url, {
		method: "HEAD",
	})

	return response.status === 200
}

export { validateCreatedLocation, doesURLExist }
