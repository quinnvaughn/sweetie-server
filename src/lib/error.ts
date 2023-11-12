import { FieldError } from "../schema/error"
import { z } from "zod"

function pathReducer(path: z.ZodIssue["path"]): string {
	// change error into name.0.innerName etc
	return path.reduce((prev, curr, i) => {
		if (i === 0) {
			return curr as string
		}
		return `${prev}.${curr}`
	}, "") as string
}

export function mapIssuesToFieldErrors(issues: z.ZodIssue[]): FieldError[] {
	return issues.map((issue) => {
		// if the path has more than 1, it means the zod element is an object with inner fields.
		const field =
			issue.path.length > 1
				? pathReducer(issue.path)
				: (issue.path[0] as string)
		return new FieldError(field, issue.message)
	})
}
