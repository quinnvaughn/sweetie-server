import { builder } from "../../builder"
import { config } from "../../config"
import { formatAddress, googleMapsClient } from "../../lib"
import { Coordinates as Co } from "@prisma/client"
import { z } from "zod"

export const Coordinates = builder.objectRef<Co>("Coordinates")

builder.objectType(Coordinates, {
	fields: (t) => ({
		lat: t.float({ resolve: (p) => p.lat }),
		lng: t.float({ resolve: (p) => p.lng }),
	}),
})

builder.objectType("Address", {
	fields: (t) => ({
		id: t.exposeID("id"),
		street: t.exposeString("street"),
		postalCode: t.exposeString("postalCode"),
		city: t.field({
			type: "City",
			resolve: async (address, _, { prisma }) => {
				return await prisma.city.findUniqueOrThrow({
					where: { id: address.cityId },
				})
			},
		}),
		coordinates: t.field({
			type: Coordinates,
			resolve: async (address, _, { prisma }) => {
				const coordinates = await prisma.coordinates.findUnique({
					where: { addressId: address.id },
				})
				if (coordinates) {
					return coordinates
				}
				const city = await prisma.city.findUniqueOrThrow({
					where: { id: address.cityId },
					select: {
						name: true,
						state: {
							select: {
								initials: true,
							},
						},
					},
				})
				const formattedAddress = formatAddress({
					...address,
					state: city.state,
					city,
				})

				const { data } = await googleMapsClient.geocode({
					params: {
						key: config.GOOGLE_MAPS_API_KEY,
						address: formattedAddress,
					},
				})
				const { results } = data
				const value = results ? results[0] : null
				if (value) {
					return await prisma.coordinates.create({
						data: {
							lat: value.geometry.location.lat,
							lng: value.geometry.location.lng,
							addressId: address.id,
						},
					})
				}
				throw new Error("No coordinates found")
			},
		}),
		formattedAddress: t.string({
			resolve: async (address, _, { prisma }) => {
				const city = await prisma.city.findUniqueOrThrow({
					where: { id: address.cityId },
					select: {
						name: true,
						state: {
							select: {
								initials: true,
							},
						},
					},
				})
				return formatAddress({ ...address, state: city.state, city })
			},
		}),
	}),
})

export const CreateOrConnectAddressInput = builder.inputType(
	"CreateOrConnectAddressInput",
	{
		fields: (t) => ({
			street: t.string({ required: true }),
			city: t.string({ required: true }),
			// the only valid state is CA right now
			// but we need to see if they picked a city in CA
			// or not
			state: t.string({ required: true }),
			postalCode: t.string({ required: true }),
		}),
	},
)

export const createAddressSchema = z.object({
	street: z.string().min(1, "Must be a valid street"),
	city: z.string().min(1, "Must be a valid city"),
	state: z
		.string()
		.min(2, "Must be a valid state")
		.max(2, "Must be a valid state"),
	postalCode: z
		.string()
		.max(12, "Postal code must be no more than 12 characters."),
})
