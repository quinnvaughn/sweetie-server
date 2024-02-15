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
						waitlistId: p.id,
					},
				}),
		}),
		numUsers: t.field({
			type: "Int",
			resolve: async (p, _a, { prisma }) => {
				// get all the users in groups
				return await prisma.user.count({
					where: {
						waitlistGroups: {
							some: {
								waitlistId: p.id,
							},
						},
					},
				})
			},
		}),
	}),
})

builder.objectType("EventWaitlistGroup", {
	fields: (t) => ({
		id: t.exposeString("id"),
		code: t.exposeString("code"),
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
		canSkipWaitlist: t.field({
			type: "Boolean",
			resolve: async (p, _a, { prisma }) => {
				// check if the number of users in the group is greater
				// than or equal to 5
				return (
					(await prisma.user.count({
						where: {
							waitlistGroups: {
								some: {
									id: p.id,
								},
							},
						},
					})) >= 5
				)
			},
		}),
	}),
})

builder.queryFields((t) => ({
	waitlist: t.field({
		type: ["EventWaitlist"],
		resolve: async (_root, _args, { prisma }) =>
			prisma.eventWaitlist.findMany({}),
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
			})
			if (!waitlist) {
				throw new Error("Waitlist not found")
			}
			// if there is a code, find the group with the code
			if (code) {
				const group = await prisma.eventWaitlistGroup.findUnique({
					where: {
						code_waitlistId: {
							code,
							waitlistId: waitlist.id,
						},
					},
				})
				if (!group) {
					throw new Error("Group not found")
				}
				// add the user to the group
				try {
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
					code_waitlistId: {
						code: newCode,
						waitlistId: waitlist.id,
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
						code_waitlistId: {
							code: newCode,
							waitlistId: waitlist.id,
						},
					},
				})
			}
			// use the new code to create a group
			try {
				const group = await prisma.eventWaitlistGroup.create({
					data: {
						waitlistId: waitlist.id,
						code: newCode,
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
