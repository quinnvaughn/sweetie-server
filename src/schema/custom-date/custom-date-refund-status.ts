import { builder } from "../../builder"

builder.objectType("CustomDateRefundStatus", {
	fields: (t) => ({
		id: t.exposeID("id"),
		name: t.exposeString("name"),
		refunds: t.field({
			type: ["CustomDateRefund"],
			resolve: (p, _, { prisma }) =>
				prisma.customDateRefund.findMany({
					where: {
						statusId: p.id,
					},
				}),
		}),
	}),
})
