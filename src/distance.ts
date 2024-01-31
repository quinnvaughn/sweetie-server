import { prisma } from "./db"
import { distanceAndDuration } from "./lib"

const freeDates: string[] = []

export async function main() {
	for (const freeDateId of freeDates) {
		await distanceAndDuration(prisma, freeDateId)
	}
}

main()
