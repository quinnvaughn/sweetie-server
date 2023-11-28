import { builder } from "../builder"
import {
	dateItineraryForGuest,
	dateItineraryForViewer,
	formatAddress,
	getICSStartDate,
} from "../lib"
import { emailQueue } from "../lib/queue"
import {
	AuthError,
	EntityCreationError,
	EntityNotFoundError,
	FieldError,
	FieldErrors,
} from "./error"
import * as ics from "ics"
import { DateTime } from "luxon"
import { z } from "zod"

export const GuestInput = builder.inputType("GuestInput", {
	fields: (t) => ({
		name: t.string({ required: false }),
		email: t.string({ required: true }),
	}),
})

const CreateDateItineraryInput = builder.inputType("CreateDateItineraryInput", {
	fields: (t) => ({
		date: t.field({ type: "DateTime", required: true }),
		experienceId: t.string({ required: true }),
		guest: t.field({ type: GuestInput, required: false }),
	}),
})

const createDateItinerarySchema = z.object({
	date: z.date({ invalid_type_error: "Date must be a valid date." }),
	experienceId: z.string(),
	guest: z
		.object({
			name: z.string().min(1, "Must be at least 1 character").or(z.literal("")),
			email: z.string().email("Must be a valid email").or(z.literal("")),
		})
		.optional(),
})

const dateExperienceSchema = z.object({
	stops: z.array(
		z.object({
			title: z.string().min(1, "Title must be at least 1 character long."),
			content: z.string().min(1, "Content must be at least 1 character long."),
			location: z.object({
				name: z.string().min(1, "Name must be at least 1 character long."),
				website: z.union([
					z.string().url("Must be a valid URL."),
					z.undefined(),
					z.literal(""),
				]),
				address: z.object({
					street: z
						.string()
						.min(1, "Street must be at least 1 character long."),
					postalCode: z
						.string()
						.min(1, "Postal code must be at least 1 character long."),
					city: z.object({
						name: z
							.string()
							.min(1, "City name must be at least 1 character long."),
						state: z.object({
							initials: z
								.string()
								.length(2, "State initials must be 2 characters long."),
						}),
					}),
				}),
			}),
		}),
	),
})

builder.mutationField("createDateItinerary", (t) =>
	t.field({
		type: "PlannedDate",
		errors: {
			types: [AuthError, FieldErrors, EntityNotFoundError, EntityCreationError],
		},
		args: {
			input: t.arg({
				type: CreateDateItineraryInput,
				required: true,
			}),
		},
		resolve: async (_p, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("Please log in to create a date.")
			}
			const result = createDateItinerarySchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { date, experienceId, guest } = input
			const validDate = DateTime.fromISO(date.toISOString())

			if (!validDate.isValid) {
				throw new FieldErrors([new FieldError("date", "Must be a valid date.")])
			}

			const dateExperience = await prisma.dateExperience.findUnique({
				where: {
					id: experienceId,
				},
				select: {
					tastemaker: {
						include: {
							user: {
								select: {
									id: true,
									username: true,
									name: true,
								},
							},
						},
					},
					title: true,
					stops: {
						orderBy: {
							order: "asc",
						},
						select: {
							title: true,
							content: true,
							location: {
								select: {
									name: true,
									website: true,
									address: {
										select: {
											street: true,
											postalCode: true,
											city: {
												select: {
													name: true,
													state: {
														select: {
															initials: true,
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			})

			if (!dateExperience) {
				throw new EntityNotFoundError("Date idea")
			}

			const dateExperienceResult =
				dateExperienceSchema.safeParse(dateExperience)

			if (!dateExperienceResult.success) {
				throw new Error("Date idea is invalid.")
			}

			const { data } = dateExperienceResult
			const icsValues = []
			for (const [index, stop] of data.stops.entries()) {
				const { value, error } = ics.createEvent({
					title: stop.location.name || stop.title,
					description: stop.content,
					busyStatus: "BUSY",
					status: "CONFIRMED",
					start: getICSStartDate(validDate.plus({ hours: index })),
					location: formatAddress({
						street: stop.location.address.street,
						city: stop.location.address.city,
						state: stop.location.address.city.state,
						postalCode: stop.location.address.postalCode,
					}),
					alarms:
						index === 0
							? [
									{
										action: "audio",
										trigger: { hours: 1, minutes: 0, before: true },
									},
							  ]
							: [],
					url: stop.location.website || undefined,
					end: getICSStartDate(validDate.plus({ hours: index + 1 })),
					organizer: { name: currentUser.name, email: currentUser.email },
					attendees: [
						{
							name: guest?.name || undefined,
							email: guest?.email || undefined,
						},
					],
				})
				if (error || !value) {
					throw new EntityCreationError("date itinerary")
				}
				icsValues.push(value)
			}

			try {
				// Planned dates are so we can show the user the dates they planned
				// to go on, as well as follow up with them with an email.
				const plannedDate = await prisma.plannedDate.create({
					data: {
						plannedTime: validDate.toJSDate(),
						experienceId,
						userId: currentUser.id,
					},
				})
				await emailQueue.add(
					"email",
					dateItineraryForViewer({
						email: currentUser.email,
						date: validDate,
						subject: guest?.name
							? `${currentUser.name}, get ready for your date with ${guest.name}!`
							: `${currentUser.name}, get ready for your date!`,
						title: dateExperience.title,
						guestName: guest?.name,
						icsValues,
						stops: data.stops.map((stop) => stop.location.name),
					}),
					{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
				)
				if (guest?.email) {
					await emailQueue.add(
						"email",
						dateItineraryForGuest({
							email: guest.email,
							date: validDate,
							subject: guest.name
								? `${guest.name}, get ready for your date with ${currentUser.name}!`
								: `${currentUser.name} invited you on a date!`,
							title: dateExperience.title,
							inviterName: currentUser.name,
							icsValues,
							name: guest.name,
							stops: data.stops.map((stop) => stop.location.name),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				}
				return plannedDate
			} catch (e) {
				throw new EntityCreationError("date itinerary")
			}
		},
	}),
)
