import { PrismaClient } from "@prisma/client"

async function seed() {
	// create records here
	const prisma = new PrismaClient()

	const allTags = await prisma.tag.findMany()

	for (const tag of allTags) {
		// make it lowercase
		const lowercaseTag = tag.name.toLowerCase()

		// update the tag
		await prisma.tag.update({
			where: {
				id: tag.id,
			},
			data: {
				name: lowercaseTag,
			},
		})
	}

	await prisma.$disconnect()
}

seed()
