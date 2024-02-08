import { Duration, Travel, TravelMode } from "@prisma/client"
import * as Sentry from "@sentry/node"
import { DateTime } from "luxon"
import { z } from "zod"
import { builder } from "../builder"
import {
	Stop,
	dateItineraryForGuest,
	dateItineraryForViewer,
	distanceAndDuration,
	emailQueue,
	generateGoogleCalendarEvents,
	generateICSValues,
	peopleIncrement,
	track,
	viewerAuthorizedCalendar,
} from "../lib"
import { AuthError, FieldError, FieldErrors } from "./error"

export const GuestInput = builder.inputType("GuestInput", {
	fields: (t) => ({
		name: t.string({ required: false }),
		email: t.string({ required: true }),
	}),
})

export const UserInput = builder.inputType("UserInput", {
	fields: (t) => ({
		name: t.string({ required: true }),
		email: t.string({ required: true }),
	}),
})

const CreateDateItineraryInput = builder.inputType("CreateDateItineraryInput", {
	fields: (t) => ({
		timeZone: t.string({ required: true }),
		date: t.field({ type: "DateTime", required: true }),
		freeDateId: t.string({ required: true }),
		guest: t.field({ type: GuestInput, required: false }),
		user: t.field({ type: UserInput, required: false }),
		selectedStopIds: t.stringList({ required: true }),
	}),
})

const createDateItinerarySchema = z.object({
	date: z.date({ invalid_type_error: "Date must be a valid date." }),
	timeZone: z.string(),
	freeDateId: z.string(),
	guest: z
		.object({
			name: z.string().min(1, "Must be at least 1 character").or(z.literal("")),
			email: z.string().email("Must be a valid email").or(z.literal("")),
		})
		.optional(),
	selectedStopIds: z.array(z.string()),
})

const freeDateSchema = z.object({
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
				origin: z
					.object({
						mode: z.enum([
							TravelMode.BOAT,
							TravelMode.CAR,
							TravelMode.PLANE,
							TravelMode.TRAIN,
							TravelMode.WALK,
						]),
					})
					.optional()
					.or(z.null()),
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
			types: [AuthError, FieldErrors, Error],
		},
		args: {
			input: t.arg({
				type: CreateDateItineraryInput,
				required: true,
			}),
		},
		resolve: async (_p, { input }, { prisma, currentUser, req }) => {
			const result = createDateItinerarySchema.safeParse(input)
			if (!result.success) {
				throw new FieldErrors(result.error.issues)
			}
			const { date, freeDateId, guest, user, timeZone, selectedStopIds } = input
			const googleCalendarDate = DateTime.fromISO(date.toISOString())
			const icsFilesDate = DateTime.fromISO(date.toISOString()).setZone(
				timeZone,
			)

			if (!googleCalendarDate.isValid) {
				throw new FieldErrors([new FieldError("date", "Must be a valid date.")])
			}

			const freeDate = await prisma.freeDate.findUnique({
				where: {
					id: freeDateId,
				},
				include: {
					tastemaker: {
						include: {
							user: true,
						},
					},
				},
			})

			if (!freeDate) {
				throw new Error("Could not find date.")
			}
			// get all the stops for the date
			const validatedStops = await prisma.dateStopOption.findMany({
				where: {
					id: {
						in: selectedStopIds,
					},
				},
				include: {
					orderedDateStop: {
						select: {
							estimatedTime: true,
						},
					},
					location: {
						include: {
							address: {
								include: {
									city: {
										include: {
											state: true,
										},
									},
								},
							},
						},
					},
				},
				orderBy: [
					{
						orderedDateStop: {
							order: "asc",
						},
					},
					{
						optionOrder: "asc",
					},
				],
			})
			// we add a check here in case the user tries to plan a date with stops that don't exist
			// create travel for all the stops if they don't exist.
			await distanceAndDuration(
				prisma,
				validatedStops.map((s) => s.orderedDateStopId),
			)
			// we need to get the stops again because the travel has been created
			const stops: Stop[] = []
			for (let i = 0; i < validatedStops.length; i++) {
				const stop = validatedStops[i]
				if (!stop) continue // if the stop doesn't exist, continue
				let travel: (Travel & { duration: Duration | null }) | null | undefined
				const nextStop: Stop | null | undefined =
					i === validatedStops.length - 1 ? null : stops[i + 1]
				if (nextStop) {
					travel = await prisma.travel.findUnique({
						where: {
							originId_destinationId: {
								destinationId: nextStop.locationId,
								originId: stop.locationId,
							},
						},
						include: {
							duration: true,
						},
					})
				}
				stops.push({
					...stop,
					estimatedTime: stop.orderedDateStop.estimatedTime,
					travel,
				})
			}
			const icsValues = generateICSValues({
				stops,
				date: icsFilesDate,
				currentUser,
				user,
				guest,
			})
			const authorizedCalendar = await viewerAuthorizedCalendar(currentUser)
			// if a user is logged in and they have authorized their calendar
			if (currentUser && authorizedCalendar) {
				generateGoogleCalendarEvents({
					currentUser,
					date: googleCalendarDate,
					stops,
					guest,
				})
			} else {
				if (currentUser) {
					await emailQueue.add(
						"email",
						dateItineraryForViewer({
							email: currentUser.email,
							date: icsFilesDate,
							subject: guest?.name
								? `${currentUser.name}, get ready for your date with ${guest.name}!`
								: `${currentUser.name}, get ready for your date!`,
							title: freeDate.title,
							guestName: guest?.name,
							icsValues,
							stops: stops.map(
								(stop) => `${stop.location.name} - ${stop.title}`,
							),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				} else if (user) {
					await emailQueue.add(
						"email",
						dateItineraryForViewer({
							email: user.email,
							date: icsFilesDate,
							subject: guest?.name
								? `${user.name}, get ready for your date with ${guest.name}!`
								: `${user.name}, get ready for your date!`,
							title: freeDate.title,
							guestName: guest?.name,
							icsValues,
							stops: validatedStops.map(
								(stop) => `${stop.location.name} - ${stop.title}`,
							),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				}
			}

			if (guest?.email) {
				// if a user has authorized their calendar, google will send an email
				// automatically, so we don't need to send one
				if (currentUser && !authorizedCalendar) {
					await emailQueue.add(
						"email",
						dateItineraryForGuest({
							email: guest.email,
							date: icsFilesDate,
							subject: guest.name
								? `${guest.name}, get ready for your date with ${currentUser.name}!`
								: `${currentUser.name} invited you on a date!`,
							title: freeDate.title,
							inviterName: currentUser.name,
							icsValues,
							name: guest.name,
							stops: stops.map(
								(stop) => `${stop.location.name} - ${stop.title}`,
							),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				} else if (user) {
					await emailQueue.add(
						"email",
						dateItineraryForGuest({
							email: guest.email,
							date: icsFilesDate,
							subject: guest.name
								? `${guest.name}, get ready for your date with ${user.name}!`
								: `${user.name} invited you on a date!`,
							title: freeDate.title,
							inviterName: user.name,
							icsValues,
							name: guest.name,
							stops: stops.map(
								(stop) => `${stop.location.name} - ${stop.title}`,
							),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				}
			}
			// track on mixpanel
			track(req, "Date Planned", {
				last_planned_date_at: new Date(),
				planned_date_for: icsFilesDate.toISO(),
				location_names: stops.map((stop) => stop.location.name),
				location_cities: stops.map((stop) => stop.location.address.city.name),
				title: freeDate.title,
				tastemaker_id: freeDate.tastemaker.user.id,
				tastemaker_name: freeDate.tastemaker.user.name,
				tastemaker_username: freeDate.tastemaker.user.username,
				user_email: currentUser?.email || user?.email,
				user_name: currentUser?.name || user?.name,
				guest_email: guest?.email,
				guest_name: guest?.name,
				method: authorizedCalendar ? "calendar" : "email",
			})
			peopleIncrement(req, {
				planned_dates: 1,
				invited_guests: guest?.email ? 1 : 0,
			})
			// Planned dates are so we can show the user the dates they planned
			// to go on, as well as follow up with them with an email.
			try {
				// check if freeDateVariation exists
				const freeDateVariation = await prisma.freeDateVariation.findFirst({
					where: {
						freeDateId,
						dateStopOptions: {
							every: {
								id: {
									in: validatedStops.map((s) => s.id),
								},
							},
						},
					},
				})
				if (!freeDateVariation) {
					// if it doesn't exist, create it and add planned date
					const variation = await prisma.freeDateVariation.create({
						data: {
							freeDateId,
							dateStopOptions: {
								connect: validatedStops.map((s) => ({ id: s.id })),
							},
						},
					})
					return await prisma.plannedDate.create({
						data: {
							userId: currentUser?.id,
							// add 1 day to current date
							plannedTime: icsFilesDate.toJSDate(),
							email: input.user?.email,
							guestEmail: input.guest?.email,
							guestName: input.guest?.name,
							freeDateVariationId: variation.id,
						},
					})
				}
				// if it does exist, add planned date
				return await prisma.plannedDate.create({
					data: {
						userId: currentUser?.id,
						// add 1 day to current date
						plannedTime: icsFilesDate.toJSDate(),
						email: input.user?.email,
						guestEmail: input.guest?.email,
						guestName: input.guest?.name,
						freeDateVariationId: freeDateVariation.id,
					},
				})
			} catch (e) {
				Sentry.setUser({ id: currentUser?.id, email: currentUser?.email })
				Sentry.captureException(e)
				throw new Error("Could not create planned date.")
			}
		},
	}),
)
