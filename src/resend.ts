import { config } from "./config"
import { prisma } from "./db"
import { resend } from "./email"

export async function main() {
	const users = await prisma.user.findMany()
	// get emails who have planned dates but no user
	const plannedDates = await prisma.plannedDate.findMany({
		where: {
			email: {
				notIn: users.map((user) => user.email),
			},
		},
		include: {
			user: {
				select: {
					email: true,
					name: true,
				},
			},
		},
	})
	const allUsers = [
		...users.map((user) => ({ email: user.email, name: user.name })),
		...plannedDates.map((plannedDate) => ({
			email: plannedDate.user?.email || plannedDate.email || undefined,
			name: plannedDate.user?.name || undefined,
		})),
	]

	const uniqueUsers = Array.from(new Set(allUsers))

	for (const user of uniqueUsers) {
		if (!user.email) {
			continue
		}
		await resend.contacts.create({
			email: user.email,
			firstName: user.name ? user.name.split(" ")[0] : undefined,
			lastName: user.name ? user.name.split(" ")[1] : undefined,
			audienceId: config.REGISTERED_USERS_AUDIENCE_ID,
		})
	}
}

main()
	.finally(() => {
		prisma.$disconnect()
		process.exit(0)
	})
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
