import { DateTime, Duration } from "luxon"

/**
 * Returns a tuple of [year, month, day, hour, minute] for use with the ics library.
 */
export function getICSStartDate(
	date: DateTime,
): [number, number, number, number, number] {
	return [date.year, date.month, date.day, date.hour, date.minute]
}

export function timeToMs(time: string) {
	return Duration.fromISOTime(time).as("milliseconds")
}
