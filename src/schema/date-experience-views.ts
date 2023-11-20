import { builder } from "../builder"

builder.objectType("DateExperienceViews", {
	fields: (t) => ({
		id: t.exposeID("id"),
		experience: t.field({
			type: "DateExperience",
			nullable: false,
			resolve: (parent, _, { prisma }) => {
				return prisma.dateExperience.findUniqueOrThrow({
					where: { id: parent.experienceId },
				})
			},
		}),
		lastViewedAt: t.field({
			type: "DateTime",
			resolve: (p) => p.lastViewedAt,
			nullable: true,
		}),
		viewCount: t.int({
			resolve: (p) => p.views,
		}),
	}),
})
