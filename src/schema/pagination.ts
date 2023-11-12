import { TypesWithDefaults, builder } from "../builder"
import { ObjectRef } from "@pothos/core"

type PageInfoShape = {
	hasNextPage: boolean
	endCursor: string
}

export const PageInfo = builder.objectRef<PageInfoShape>("PageInfo")

builder.objectType(PageInfo, {
	fields: (t) => ({
		hasNextPage: t.boolean({ resolve: (p) => p.hasNextPage }),
		endCursor: t.string({ resolve: (p) => p.endCursor }),
	}),
})

export function addConnectionFields<
	T extends {
		node: TypesWithDefaults["Objects"][keyof TypesWithDefaults["Objects"]]
		cursor: string
	},
>(
	ref: ObjectRef<
		unknown,
		{ edges: T[]; pageInfo: PageInfoShape; totalCount?: number }
	>,
) {
	const name = ref.name.split("Connection")[0]
	const Edges = builder.objectRef<T>(`${name}Edge`)

	builder.objectType(Edges, {
		fields: (t) => ({
			cursor: t.string({ resolve: (p) => p.cursor }),
			node: t.field({
				type: name as keyof TypesWithDefaults["Objects"],
				resolve: (p) => p.node,
			}),
		}),
	})

	builder.objectFields(ref, (t) => ({
		edges: t.field({
			type: [Edges],
			resolve: (p) => p.edges,
		}),
		pageInfo: t.field({
			type: PageInfo,
			resolve: (p) => p.pageInfo,
		}),
		totalCount: t.int({
			resolve: (p) => p.totalCount,
			nullable: true,
		}),
	}))
}
