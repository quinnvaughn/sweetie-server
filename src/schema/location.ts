import { PlaceAutocompleteType } from "@googlemaps/google-maps-services-js"
import { Location } from "@prisma/client"
import * as Sentry from "@sentry/node"
import { z } from "zod"
import { builder } from "../builder"
import { config } from "../config"
import {
	ConnectionShape,
	connectionFromArraySlice,
	decodeCursor,
	getDefaultFirst,
	googleMapsClient,
	validateCreatedLocation,
} from "../lib"
import {
	CreateOrConnectAddressInput,
	createAddressSchema,
} from "./address/address"
import { AuthError, FieldError, FieldErrors } from "./error"
import { addConnectionFields } from "./pagination"

builder.objectType("Location", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		website: t.exposeString("website", { nullable: true }),
		images: t.exposeStringList("images"),
		address: t.field({
			type: "Address",
			resolve: async (p, _, { prisma }) =>
				await prisma.address.findUniqueOrThrow({ where: { id: p.addressId } }),
		}),
	}),
})

const createLocationSchema = z.object({
	name: z
		.string()
		.min(1, "Name must be at least one character.")
		.max(1000, "Name must be no more than 1000 characters."),
	website: z.union([
		z.literal(""),
		z.string().trim().url("Must be a valid URL."),
	]),
	address: createAddressSchema,
	type: z.enum(["create", "search"]),
})

const CreateLocationInput = builder.inputType("CreateLocationInput", {
	fields: (t) => ({
		name: t.string({ required: true }),
		address: t.field({ type: CreateOrConnectAddressInput, required: true }),
		website: t.string({ required: false }),
		type: t.string({ required: true }),
	}),
})

builder.mutationField("createLocation", (t) =>
	t.field({
		type: "Location",
		args: {
			input: t.arg({ type: CreateLocationInput, required: true }),
		},
		errors: {
			types: [AuthError, FieldErrors, Error],
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in to create a location.")
			}

			const validatedInput = createLocationSchema.safeParse(input)
			if (!validatedInput.success) {
				throw new FieldErrors(validatedInput.error.issues)
			}

			const { name, website, address, type } = validatedInput.data

			if (type === "create") {
				const response = await validateCreatedLocation({
					address,
					website,
				})

				const errors = []

				if (response.validatedAddress) {
					errors.push(
						new FieldError("address.street", response.validatedAddress),
					)
				}

				if (response.validatedWebsite) {
					errors.push(new FieldError("website", response.validatedWebsite))
				}

				if (errors.length > 0) {
					throw new FieldErrors(errors)
				}
			}

			const locationAlreadyExists = await prisma.location.findFirst({
				where: {
					name,
					website,
					address: {
						street: address.street,
						city: {
							name: address.city,
							state: {
								initials: address.state,
							},
						},
						postalCode: address.postalCode,
					},
				},
			})

			if (locationAlreadyExists) {
				return locationAlreadyExists
			}
			if (address.state !== "CA") {
				throw new FieldErrors([
					new FieldError(
						"name",
						"Only California addresses are supported at this time.",
					),
				])
			}
			const city = await prisma.city.findFirst({
				where: {
					name: address.city,
					state: {
						initials: address.state,
					},
				},
			})
			if (!city) {
				throw new FieldErrors([new FieldError("name", "City not found.")])
			}
			try {
				return await prisma.location.create({
					data: {
						name,
						website,
						address: {
							connectOrCreate: {
								create: {
									street: address.street,
									city: {
										connect: {
											id: city.id,
										},
									},
									postalCode: address.postalCode,
								},
								where: {
									street_postalCode_cityId: {
										street: address.street,
										postalCode: address.postalCode,
										cityId: city.id,
									},
								},
							},
						},
					},
				})
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				throw new Error("Unable to create location.")
			}
		},
	}),
)

export const LocationConnection = builder
	.objectRef<ConnectionShape<Location>>("LocationConnection")
	.implement({})

addConnectionFields(LocationConnection)

type GoogleLocationShape = {
	name: string
	formattedAddress: string
	website?: string
}

export const GoogleLocation =
	builder.objectRef<GoogleLocationShape>("GoogleLocation")

builder.objectType(GoogleLocation, {
	fields: (t) => ({
		name: t.exposeString("name"),
		formattedAddress: t.exposeString("formattedAddress"),
		website: t.exposeString("website", { nullable: true }),
	}),
})

// If the location doesn't exist and they're looking for a new one
// to create, we then pass these fields to the createLocation mutation
builder.queryField("getGoogleLocations", (t) =>
	t.field({
		type: [GoogleLocation],
		args: {
			text: t.arg.string({ required: true }),
		},
		resolve: async (_p, { text }, { prisma }) => {
			// TODO: cache this, almost never changes.
			const allCities = await prisma.city.findMany({
				select: {
					name: true,
					state: {
						select: {
							initials: true,
						},
					},
				},
			})
			const result = await googleMapsClient.placeAutocomplete({
				params: {
					key: config.GOOGLE_MAPS_API_KEY,
					input: text,
					types: PlaceAutocompleteType.establishment,
					components: ["country:us"],
					// this helps remove suggestions that are too far away
					// that we don't have to filter out manually.
					radius: 500000,
					location: {
						lat: 34.0522,
						lng: 118.2437,
					},
				},
			})

			const ids = result.data.predictions.map((p) => p.place_id)
			const promises = ids.map((id) => {
				return googleMapsClient.placeDetails({
					params: {
						key: config.GOOGLE_MAPS_API_KEY,
						place_id: id,
						fields: ["formatted_address", "name", "website"],
					},
				})
			})
			const values = await Promise.all(promises)
			return values
				.filter((v) => {
					const city = v.data.result.formatted_address?.split(",")[1]?.trim()

					const state = v.data.result.formatted_address
						?.split(",")[2]
						?.trim()
						?.split(" ")[0]
						?.trim()

					if (!city) {
						return false
					}
					if (
						allCities.find((c) => c.name === city && c.state.initials === state)
					) {
						return true
					}
					return false
				})
				.map((v) => ({
					formattedAddress: v.data.result.formatted_address ?? "",
					name: (v.data.result.name as string) ?? "",
					website: v.data.result.website ?? "",
				}))
		},
	}),
)

builder.queryField("locations", (t) =>
	t.field({
		type: LocationConnection,
		args: {
			after: t.arg.string(),
			first: t.arg.int({ defaultValue: 5 }),
			text: t.arg.string({ required: true }),
		},
		resolve: async (_p, { after, first, text }, { prisma }) => {
			const defaultFirst = getDefaultFirst(first)
			let decodedCursor: Date | null = null
			if (after) {
				decodedCursor = decodeCursor(after)
			}
			const locations = await prisma.location.findMany({
				orderBy: {
					createdAt: "desc",
				},
				take: defaultFirst + 1,
				where: {
					AND: [
						{
							name: {
								contains: text.trim(),
								mode: "insensitive",
							},
						},
						{
							createdAt: decodedCursor
								? {
										lt: decodedCursor,
								  }
								: undefined,
						},
					],
				},
			})
			return connectionFromArraySlice(
				{ arraySlice: locations },
				{ first: defaultFirst, after },
			)
		},
	}),
)
