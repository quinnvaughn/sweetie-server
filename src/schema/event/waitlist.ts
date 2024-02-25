import { generate } from "voucher-code-generator"
import { builder } from "../../builder"
import { AuthError } from "../error"

builder.objectType("EventWaitlist", {
	fields: (t) => ({
		id: t.exposeString("id"),
		groups: t.field({
			type: ["EventWaitlistGroup"],
			resolve: async (p, _a, { prisma }) =>
				prisma.eventWaitlistGroup.findMany({
					where: {
						eventWaitlistId: p.id,
					},
					orderBy: {
						users: {
							// sort by the number of users in the group
							_count: "desc",
						},
					},
				}),
		}),
	}),
})

builder.objectType("EventWaitlistGroup", {
	fields: (t) => ({
		id: t.exposeString("id"),
		code: t.exposeString("code"),
		position: t.exposeInt("position"),
		users: t.field({
			type: ["User"],
			resolve: async (p, _a, { prisma }) =>
				prisma.user.findMany({
					where: {
						waitlistGroups: {
							some: {
								id: p.id,
							},
						},
					},
				}),
		}),
	}),
})

builder.queryFields((t) => ({
	waitlist: t.field({
		type: ["EventWaitlist"],
		resolve: async (_root, _args, { prisma }) =>
			prisma.eventWaitlist.findMany({
				orderBy: {
					event: {
						waitlist: {
							groups: {
								_count: "desc",
							},
						},
					},
				},
			}),
	}),
	eventWaitlist: t.field({
		type: "EventWaitlist",
		errors: {
			types: [Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_root, { id }, { prisma }) => {
			const waitlist = await prisma.eventWaitlist.findUnique({
				where: {
					id,
				},
			})
			if (!waitlist) {
				throw new Error("Waitlist not found")
			}
			return waitlist
		},
	}),
}))

const SignUpForWaitlistInput = builder.inputType("SignUpForWaitlistInput", {
	fields: (t) => ({
		eventId: t.string({ required: true }),
		code: t.string({ required: false }),
	}),
})

builder.mutationFields((t) => ({
	signUpForWaitlist: t.field({
		type: "EventWaitlistGroup",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: SignUpForWaitlistInput, required: true }),
		},
		resolve: async (
			_root,
			{ input: { eventId, code } },
			{ prisma, currentUser },
		) => {
			if (!currentUser) {
				throw new AuthError("Not authenticated")
			}
			const waitlist = await prisma.eventWaitlist.findUnique({
				where: {
					eventId,
				},
				include: {
					_count: {
						select: {
							groups: true,
						},
					},
					groups: {
						orderBy: {
							position: "asc",
						},
					},
				},
			})
			if (!waitlist) {
				throw new Error("Waitlist not found")
			}
			// if there is a code, find the group with the code
			if (code) {
				const group = await prisma.eventWaitlistGroup.findUnique({
					where: {
						code_eventWaitlistId: {
							code,
							eventWaitlistId: waitlist.id,
						},
					},
					include: {
						_count: {
							select: {
								users: true,
							},
						},
					},
				})
				if (!group) {
					throw new Error("Group not found")
				}
				// add the user to the group
				try {
					// recalculate the position of the group by number of users
					// get all the groups with position less than the current group
					// and count the number of users in each group
					// to see if the current group should be moved up
					const groups = await prisma.eventWaitlistGroup.findMany({
						where: {
							eventWaitlistId: waitlist.id,
							position: {
								lt: group.position,
							},
						},
						orderBy: {
							position: "asc",
						},
						include: {
							_count: {
								select: {
									users: true,
								},
							},
						},
					})
					// position is decided by first number of users and then creation date
					// if the group has more users than the previous group, it should be moved up
					// if a group has the same number of users, the one created first should be moved up
					// any update to the position should also update the position of the other groups
					// that are affected
					// moved up means the position should be decreased by 1
					// if the group is already at the top, it should not be moved
					let newPosition = group.position
					const newCount = group._count.users + 1
					for (const g of groups) {
						// if waitlist group has more numbers than g
						if (newCount > g._count.users) {
							newPosition = g.position
							break
						}
						// if the waitlist group has the same number of users as g
						// and was created before g
						if (newCount === g._count.users) {
							if (group.createdAt < g.createdAt) {
								newPosition = g.position
							}
							break
						}
					}
					// if we need to move the group up
					if (newPosition !== group.position) {
						const otherGroups = await prisma.eventWaitlistGroup.findMany({
							where: {
								eventWaitlistId: waitlist.id,
								position: {
									gte: newPosition,
									lt: group.position,
								},
							},
						})
						const updates = otherGroups.map((g) =>
							prisma.eventWaitlistGroup.update({
								where: {
									id: g.id,
								},
								data: {
									position: g.position + 1,
								},
							}),
						)
						await prisma.$transaction([
							...updates,
							prisma.eventWaitlistGroup.update({
								where: {
									id: group.id,
								},
								data: {
									position: newPosition,
								},
							}),
						])
					}

					await prisma.user.update({
						where: {
							id: currentUser.id,
						},
						data: {
							waitlistGroups: {
								connect: {
									id: group.id,
								},
							},
						},
					})
				} catch {
					throw new Error("Failed to sign up for waitlist")
				}
				return group
			}
			// if there is no code, create new group and add the user
			let newCode = generate({
				length: 6,
				count: 1,
				// numbers and uppercase letters
				charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
			})[0] as string
			// check if a group with the code already exists
			let groupExists = await prisma.eventWaitlistGroup.findUnique({
				where: {
					code_eventWaitlistId: {
						code: newCode,
						eventWaitlistId: waitlist.id,
					},
				},
			})
			// if the group exists, generate a new code until a unique code is found
			while (groupExists) {
				newCode = generate({
					length: 6,
					count: 1,
					charset: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ",
				})[0] as string
				groupExists = await prisma.eventWaitlistGroup.findUnique({
					where: {
						code_eventWaitlistId: {
							code: newCode,
							eventWaitlistId: waitlist.id,
						},
					},
				})
			}
			// use the new code to create a group
			try {
				const group = await prisma.eventWaitlistGroup.create({
					data: {
						eventWaitlistId: waitlist.id,
						code: newCode,
						position: waitlist._count.groups + 1,
					},
				})
				await prisma.user.update({
					where: {
						id: currentUser.id,
					},
					data: {
						waitlistGroups: {
							connect: {
								id: group.id,
							},
						},
					},
				})
				return group
			} catch {
				throw new Error("Failed to sign up for waitlist")
			}
		},
	}),
}))
