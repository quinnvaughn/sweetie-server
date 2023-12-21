import { google } from "googleapis"
import * as ics from "ics"
import { DateTime } from "luxon"
import { z } from "zod"
import { builder } from "../builder"
import {
	dateItineraryForGuest,
	dateItineraryForViewer,
	formatAddress,
	getICSStartDate,
	oauth2Client,
	peopleIncrement,
	track,
	viewerAuthorizedCalendar,
} from "../lib"
import { emailQueue } from "../lib/queue"
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
		date: t.field({ type: "DateTime", required: true }),
		freeDateId: t.string({ required: true }),
		guest: t.field({ type: GuestInput, required: false }),
		user: t.field({ type: UserInput, required: false }),
	}),
})

const createDateItinerarySchema = z.object({
	date: z.date({ invalid_type_error: "Date must be a valid date." }),
	freeDateId: z.string(),
	guest: z
		.object({
			name: z.string().min(1, "Must be at least 1 character").or(z.literal("")),
			email: z.string().email("Must be a valid email").or(z.literal("")),
		})
		.optional(),
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
			const { date, freeDateId, guest, user } = input
			const validDate = DateTime.fromISO(date.toISOString())

			if (!validDate.isValid) {
				throw new FieldErrors([new FieldError("date", "Must be a valid date.")])
			}

			const freeDate = await prisma.freeDate.findUnique({
				where: {
					id: freeDateId,
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

			if (!freeDate) {
				throw new Error("Could not find date.")
			}

			const freeDateResult = freeDateSchema.safeParse(freeDate)

			if (!freeDateResult.success) {
				throw new Error("Date is invalid.")
			}

			const { data } = freeDateResult

			const icsValues = []
			for (const [index, stop] of data.stops.entries()) {
				const { value, error } = ics.createEvent({
					startInputType: "local",
					startOutputType: "local",
					endInputType: "local",
					endOutputType: "local",
					title: stop.location.name || stop.title,
					description: `${stop.content}\n\n${stop.location.website}`,
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
					end: getICSStartDate(validDate.plus({ hours: index + 1 })),
					organizer: currentUser
						? { name: currentUser.name, email: currentUser.email }
						: { name: user?.name, email: user?.email },
					attendees:
						guest?.name && guest?.email
							? [
									{
										name: guest.name,
										email: guest.email,
									},
							  ]
							: undefined,
				})
				if (error || !value) {
					throw new Error("Could not create date itinerary.")
				}
				icsValues.push(value)
			}

			// if a user is logged in and they have authorized their calendar
			if (currentUser && (await viewerAuthorizedCalendar(currentUser))) {
				// we don't need to create an ics file, we can just create an event
				oauth2Client.setCredentials({
					refresh_token: currentUser.googleRefreshToken,
				})
				const calendar = google.calendar({ version: "v3", auth: oauth2Client })
				for (const [index, stop] of data.stops.entries()) {
					// create the event
					// add the event to the calendar
					calendar.events.insert({
						auth: oauth2Client,
						calendarId: "primary",
						requestBody: {
							attendees: guest?.email
								? [
										{
											email: guest.email,
											displayName: guest.name ?? "",
											responseStatus: "needsAction",
										},
										{
											email: currentUser.email,
											displayName: currentUser.name,
											responseStatus: "accepted",
										},
								  ]
								: undefined,
							summary: stop.title,
							description: `${stop.content}\n\n${stop.location.website}`,
							location: formatAddress({
								street: stop.location.address.street,
								city: stop.location.address.city,
								state: stop.location.address.city.state,
								postalCode: stop.location.address.postalCode,
							}),
							start: {
								dateTime: validDate.plus({ hours: index }).toISO(),
								timeZone: validDate.zoneName,
							},
							end: {
								dateTime: validDate.plus({ hours: index + 1 }).toISO(),
								timeZone: validDate.zoneName,
							},
						},
					})
				}
			} else {
				if (currentUser) {
					await emailQueue.add(
						"email",
						dateItineraryForViewer({
							email: currentUser.email,
							date: validDate,
							subject: guest?.name
								? `${currentUser.name}, get ready for your date with ${guest.name}!`
								: `${currentUser.name}, get ready for your date!`,
							title: freeDate.title,
							guestName: guest?.name,
							icsValues,
							stops: data.stops.map((stop) => stop.location.name),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				} else if (user) {
					await emailQueue.add(
						"email",
						dateItineraryForViewer({
							email: user.email,
							date: validDate,
							subject: guest?.name
								? `${user.name}, get ready for your date with ${guest.name}!`
								: `${user.name}, get ready for your date!`,
							title: freeDate.title,
							guestName: guest?.name,
							icsValues,
							stops: data.stops.map((stop) => stop.location.name),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				}
			}

			if (guest?.email) {
				// if a user has authorized their calendar, google will send an email
				// automatically, so we don't need to send one
				if (currentUser && !(await viewerAuthorizedCalendar(currentUser))) {
					await emailQueue.add(
						"email",
						dateItineraryForGuest({
							email: guest.email,
							date: validDate,
							subject: guest.name
								? `${guest.name}, get ready for your date with ${currentUser.name}!`
								: `${currentUser.name} invited you on a date!`,
							title: freeDate.title,
							inviterName: currentUser.name,
							icsValues,
							name: guest.name,
							stops: data.stops.map((stop) => stop.location.name),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				} else if (user) {
					await emailQueue.add(
						"email",
						dateItineraryForGuest({
							email: guest.email,
							date: validDate,
							subject: guest.name
								? `${guest.name}, get ready for your date with ${user.name}!`
								: `${user.name} invited you on a date!`,
							title: freeDate.title,
							inviterName: user.name,
							icsValues,
							name: guest.name,
							stops: data.stops.map((stop) => stop.location.name),
						}),
						{ attempts: 3, backoff: { type: "exponential", delay: 1000 } },
					)
				}
			}
			// track on mixpanel
			track(req, "Date Planned", {
				last_planned_date_at: new Date(),
				day_of_planned_date: validDate.weekdayLong,
				time_of_planned_date: validDate.toLocaleString(DateTime.TIME_SIMPLE),
				location_names: freeDate.stops.map((stop) => stop.location.name),
				location_cities: freeDate.stops.map(
					(stop) => stop.location.address.city.name,
				),
				title: freeDate.title,
				tastemaker_id: freeDate.tastemaker.user.id,
				tastemaker_name: freeDate.tastemaker.user.name,
				tastemaker_username: freeDate.tastemaker.user.username,
				user_email: currentUser?.email || user?.email,
				user_name: currentUser?.name || user?.name,
			})
			peopleIncrement(req, {
				planned_dates: 1,
				invited_guests: guest?.email ? 1 : 0,
			})
			// Planned dates are so we can show the user the dates they planned
			// to go on, as well as follow up with them with an email.
			try {
				return await prisma.plannedDate.create({
					data: {
						plannedTime: validDate.toJSDate(),
						freeDateId,
						userId: currentUser?.id,
						email: input.user?.email,
					},
				})
			} catch {
				throw new Error("Could not create planned date.")
			}
		},
	}),
)
