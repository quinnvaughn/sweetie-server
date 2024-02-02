import { prisma } from "./db"

async function main() {
	console.log("Deleting users")
	const users = await prisma.user.findMany({
		where: {
			email: {
				in: ["qvaughn3@gmail.com", "quinn@trysweetie.com"],
			},
		},
	})

	for (const user of users) {
		try {
			await prisma.user.delete({
				where: {
					id: user.id,
				},
			})
		} catch (e) {
			console.error(e)
		}
	}
}

main()
	.finally(() => {
		prisma.$disconnect()
		process.exit(0)
	})
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
