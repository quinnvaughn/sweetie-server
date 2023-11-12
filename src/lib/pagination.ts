export function decodeCursor(cursor: string) {
	const bufferedCursor = Buffer.from(cursor, "base64").toString("utf-8")
	const isDate = Date.parse(bufferedCursor)
	if (isNaN(isDate)) {
		return null
	}
	return new Date(bufferedCursor)
}

export function encodeCursor(createdAt: Date) {
	return Buffer.from(createdAt.toString()).toString("base64")
}

const DEFAULT_FIRST = 10

export function getDefaultFirst(first?: number | null) {
	return first || DEFAULT_FIRST
}

export function notEmpty<TValue>(
	value: TValue | null | undefined,
): value is TValue {
	return value !== null && value !== undefined
}

export function connectionFromArraySlice<T extends { createdAt: Date }>(
	value: { arraySlice: Array<T>; totalCount?: number },
	args: { first: number; after?: string | null },
): ConnectionShape<T> {
	let edges: Array<{ cursor: string; node: T }> = []
	const { arraySlice, totalCount } = value

	if (arraySlice.length === 0) {
		return {
			pageInfo: {
				hasNextPage: false,
				endCursor: "",
			},
			totalCount,
			edges,
		}
	}

	const hasNextPage = arraySlice.length > args.first

	const nodes = hasNextPage ? arraySlice.slice(0, -1) : arraySlice
	edges = nodes.map((item) => ({
		cursor: encodeCursor(item.createdAt),
		node: item,
	}))

	const lastItem = arraySlice.at(-1)

	const endCursor = !lastItem?.createdAt ? "" : encodeCursor(lastItem.createdAt)

	return {
		pageInfo: {
			hasNextPage,
			endCursor,
		},
		totalCount,
		edges,
	}
}

export type ConnectionShape<T> = {
	edges: EdgeShape<T>[]
	pageInfo: PageInfoShape
	totalCount?: number
}

type EdgeShape<T> = {
	cursor: string
	node: T
}

type PageInfoShape = {
	hasNextPage: boolean
	endCursor: string
}
