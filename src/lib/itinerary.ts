import { Duration, State, TravelMode, User } from "@prisma/client"
import { google } from "googleapis"
import * as ics from "ics"
import { DateTime } from "luxon"
import { match } from "ts-pattern"
import { formatAddress } from "./address"
import { getICSStartDate } from "./dates"
import { oauth2Client } from "./gcp"

type Props = {
	stops: Stop[]
	date: DateTime
	currentUser?: {
		name: string
		email: string
	} | null
	user?: {
		name: string
		email: string
	} | null
	guest?: {
		name?: string | null
		email: string
	} | null
}

type Stop = {
	title?: string
	content: string
	travel: {
		mode: TravelMode
		duration: Duration | null
	} | null
	location: {
		website?: string | null
		name: string
		address: {
			street: string
			city: { name: string } & {
				state: {
					initials: State["initials"]
				}
			}
			postalCode: string
		}
	}
}

function travelToText(mode: TravelMode) {
	return match(mode)
		.with(
			TravelMode.BOAT,
			() => "We recommend taking a boat to your next destination.",
		)
		.with(
			TravelMode.CAR,
			() => "We recommend driving to your next destination.",
		)
		.with(
			TravelMode.PLANE,
			() => "We recommend flying to your next destination.",
		)
		.with(
			TravelMode.TRAIN,
			() => "We recommend taking a train to your next destination.",
		)
		.with(
			TravelMode.WALK,
			() => "We recommend walking to your next destination.",
		)
		.exhaustive()
}

export function generateICSValues({
	stops,
	date,
	currentUser,
	user,
	guest,
}: Props) {
	const icsValues = []
	let travelTime = 0
	for (let index = 0; index < stops.length; index++) {
		const stop = stops[index]
		const previousStop = index === 0 ? null : stops[index - 1]
		if (!stop) continue
		if (previousStop?.travel?.duration?.value) {
			travelTime += previousStop.travel.duration.value
		}
		const { value, error } = ics.createEvent({
			startInputType: "local",
			startOutputType: "local",
			endInputType: "local",
			endOutputType: "local",
			title: stop.location.name || stop.title,
			description: `${stop.content}\n\n${
				stop.travel?.mode ? `${travelToText(stop.travel.mode)}\n\n` : ""
			}${stop.location.website}`,
			busyStatus: "BUSY",
			status: "CONFIRMED",
			start: getICSStartDate(date.plus({ hours: index, minutes: travelTime })),
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
			end: getICSStartDate(
				date.plus({ hours: index + 1, minutes: travelTime }),
			),
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
	return icsValues
}

type GoogleCalendarEventProps = {
	currentUser: User
	date: DateTime
	guest?: {
		name?: string | null
		email: string
	} | null
	stops: Stop[]
}

export function generateGoogleCalendarEvents({
	currentUser,
	guest,
	date,
	stops,
}: GoogleCalendarEventProps) {
	// we don't need to create an ics file, we can just create an event
	oauth2Client.setCredentials({
		refresh_token: currentUser.googleRefreshToken,
	})
	const calendar = google.calendar({ version: "v3", auth: oauth2Client })
	let travelTime = 0
	for (let i = 0; i < stops.length; i++) {
		const stop = stops[i]
		const previousStop = i === 0 ? null : stops[i - 1]
		if (!stop) continue
		if (previousStop?.travel?.duration?.value) {
			travelTime += previousStop.travel.duration.value
		}

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
				summary: `${stop.location.name} - ${stop.title}`,
				description: `${stop.content}\n\n${
					stop.travel?.mode ? `${travelToText(stop.travel.mode)}\n\n` : ""
				}${stop.location.website}`,
				location: formatAddress({
					street: stop.location.address.street,
					city: stop.location.address.city,
					state: stop.location.address.city.state,
					postalCode: stop.location.address.postalCode,
				}),
				start: {
					// we are taking into account the travel time
					dateTime: date.plus({ hours: i, minutes: travelTime }).toISO(),
				},
				end: {
					// TODO: We make this the amount of time the tastemaker
					// sets for the stop, but we should also add the travel time
					dateTime: date.plus({ hours: i + 1, minutes: travelTime }).toISO(),
				},
			},
		})
	}
}
