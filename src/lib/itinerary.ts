import { formatAddress } from "./address"
import { getICSStartDate } from "./dates"
import { City, State } from "@prisma/client"
import * as ics from "ics"
import { DateTime } from "luxon"

type Props = {
	stops: Stop[]
	date: DateTime
	currentUser: {
		name: string
		email: string
	}
	guest?: {
		name?: string
		email: string
	}
}

type Stop = {
	title?: string
	content: string
	location: {
		website?: string | null
		name: string
		address: {
			street: string
			city: City & {
				state: State
			}
			postalCode: string
		}
	}
}

export function generateICSValues({ stops, date, currentUser, guest }: Props) {
	const icsValues = []
	for (const [index, stop] of stops.entries()) {
		const { value, error } = ics.createEvent({
			title: stop.location.name || stop.title,
			description: stop.content,
			busyStatus: "BUSY",
			status: "CONFIRMED",
			start: getICSStartDate(date.plus({ hours: index })),
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
			end: getICSStartDate(date.plus({ hours: index + 1 })),
			organizer: { name: currentUser.name, email: currentUser.email },
			attendees: [
				{
					name: guest?.name || undefined,
					email: guest?.email || undefined,
				},
			],
		})
		if (error || !value) {
			throw new Error("Error generating ICS file")
		}
		icsValues.push(value)
	}
	return icsValues
}
