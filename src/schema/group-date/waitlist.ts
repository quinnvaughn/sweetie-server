import { generate } from "voucher-code-generator"
import { builder } from "../../builder"
import { emailQueue, userSignsUpForGroupDateWaitlist } from "../../lib"
import { AuthError } from "../error"

builder.objectType("GroupDateWaitlist", {
	fields: (t) => ({
		id: t.exposeString("id"),
		groups: t.field({
			type: ["GroupDateWaitlistGroup"],
			resolve: async (p, _a, { prisma }) =>
				prisma.groupDateWaitlistGroup.findMany({
					where: {
						groupDateWaitlistId: p.id,
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

builder.objectType("GroupDateWaitlistGroup", {
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
		type: ["GroupDateWaitlist"],
		resolve: async (_root, _args, { prisma }) =>
			prisma.groupDateWaitlist.findMany({
				orderBy: {
					groupDate: {
						waitlist: {
							groups: {
								_count: "desc",
							},
						},
					},
				},
			}),
	}),
	groupDateWaitlist: t.field({
		type: "GroupDateWaitlist",
		errors: {
			types: [Error],
		},
		args: {
			id: t.arg.string({ required: true }),
		},
		resolve: async (_root, { id }, { prisma }) => {
			const waitlist = await prisma.groupDateWaitlist.findUnique({
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
		groupDateId: t.string({ required: true }),
		code: t.string({ required: false }),
	}),
})

builder.mutationFields((t) => ({
	signUpForWaitlist: t.field({
		type: "GroupDateWaitlistGroup",
		errors: {
			types: [AuthError, Error],
		},
		args: {
			input: t.arg({ type: SignUpForWaitlistInput, required: true }),
		},
		resolve: async (
			_root,
			{ input: { groupDateId, code } },
			{ prisma, currentUser },
		) => {
			if (!currentUser) {
				throw new AuthError("Not authenticated")
			}
			const waitlist = await prisma.groupDateWaitlist.findUnique({
				where: {
					groupDateId,
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
					groupDate: {
						select: {
							title: true,
						},
					},
				},
			})
			if (!waitlist) {
				throw new Error("Waitlist not found")
			}
			// if there is a code, find the group with the code
			if (code) {
				const group = await prisma.groupDateWaitlistGroup.findUnique({
					where: {
						code_groupDateWaitlistId: {
							code,
							groupDateWaitlistId: waitlist.id,
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
					const groups = await prisma.groupDateWaitlistGroup.findMany({
						where: {
							groupDateWaitlistId: waitlist.id,
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
						const otherGroups = await prisma.groupDateWaitlistGroup.findMany({
							where: {
								groupDateWaitlistId: waitlist.id,
								position: {
									gte: newPosition,
									lt: group.position,
								},
							},
						})
						const updates = otherGroups.map((g) =>
							prisma.groupDateWaitlistGroup.update({
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
							prisma.groupDateWaitlistGroup.update({
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
			let groupExists = await prisma.groupDateWaitlistGroup.findUnique({
				where: {
					code_groupDateWaitlistId: {
						code: newCode,
						groupDateWaitlistId: waitlist.id,
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
				groupExists = await prisma.groupDateWaitlistGroup.findUnique({
					where: {
						code_groupDateWaitlistId: {
							code: newCode,
							groupDateWaitlistId: waitlist.id,
						},
					},
				})
			}
			// use the new code to create a group
			try {
				const group = await prisma.groupDateWaitlistGroup.create({
					data: {
						groupDateWaitlistId: waitlist.id,
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
				// email the user all the stuff.
				await emailQueue.add(
					"email",
					userSignsUpForGroupDateWaitlist({
						email: currentUser.email,
						userName: currentUser.name,
						groupDateTitle: waitlist.groupDate.title,
						code: newCode,
						groupDateId: groupDateId,
					}),
				)

				return group
			} catch {
				throw new Error("Failed to sign up for waitlist")
			}
		},
	}),
}))
