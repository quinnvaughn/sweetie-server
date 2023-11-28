import { builder } from "../builder"
import { AuthError } from "./error"

builder.objectType("Role", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
	}),
})

const CreateRoleInput = builder.inputType("CreateRoleInput", {
	fields: (t) => ({
		name: t.string({ required: true }),
	}),
})

builder.mutationField("createRole", (t) =>
	t.field({
		type: "Role",
		errors: { types: [AuthError, Error] },
		args: {
			input: t.arg({ type: CreateRoleInput, required: true }),
		},
		resolve: async (_, { input }, { prisma, currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in.")
			}

			const role = await prisma.role.findUnique({
				where: { id: currentUser.roleId },
			})

			if (!role || role.name !== "admin") {
				throw new AuthError("You do not have permission to do that.")
			}
			try {
				return await prisma.role.create({
					data: {
						name: input.name,
					},
				})
			} catch {
				throw new Error("Something went wrong.")
			}
		},
	}),
)
