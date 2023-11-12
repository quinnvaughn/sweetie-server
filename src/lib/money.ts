export function calculateCustomDatePrice(stopPrice: number, numStops: number) {
	const total = stopPrice * numStops
	const dollarTotal = total / 100
	const stripeCents = 0.3 // 30 cents
	return Math.round(((dollarTotal + stripeCents) / (1 - 0.029)) * 100)
}

/**
 * Calculates the price of a custom date without the stripe fee
 * This is mostly used for the payout, so the response is formatted
 * to be in dollars/cents
 */
export function calculateCustomDatePriceWithoutStripeFee(
	stopPrice: number,
	numStops: number,
) {
	const total = stopPrice * numStops
	const dollarTotal = total / 100
	return Math.round(dollarTotal)
}
