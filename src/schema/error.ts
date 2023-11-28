import { builder } from "../builder"
import { mapIssuesToFieldErrors } from "../lib"
import { z } from "zod"

const ErrorInterface = builder.interfaceRef<Error>("BaseError").implement({
	fields: (t) => ({
		message: t.exposeString("message"),
	}),
})

builder.objectType(Error, {
	name: "Error",
	interfaces: [ErrorInterface],
})

// Auth has its own because we will want to redirect to login page
export class AuthError extends Error {
	constructor(message: string) {
		super(message)

		this.name = "AuthError"
	}
}

builder.objectType(AuthError, {
	name: "AuthError",
	interfaces: [ErrorInterface],
})

export class AlreadyLoggedInError extends Error {
	constructor() {
		super("Already logged in")

		this.name = "AlreadyLoggedInError"
	}
}

builder.objectType(AlreadyLoggedInError, {
	name: "AlreadyLoggedInError",
	interfaces: [ErrorInterface],
})

export class FieldError {
	field: string
	message: string
	constructor(field: string, message: string) {
		this.field = field
		this.message = message
	}
}

builder.objectType(FieldError, {
	name: "FieldError",
	fields: (t) => ({
		field: t.exposeString("field"),
		message: t.exposeString("message"),
	}),
})

export class FieldErrors extends Error {
	fieldErrors: FieldError[]
	constructor(fieldErrors: z.ZodIssue[] | FieldError[]) {
		super()
		this.name = "FieldErrors"
		if (fieldErrors[0] instanceof FieldError) {
			this.fieldErrors = fieldErrors as FieldError[]
			return
		}
		this.fieldErrors = mapIssuesToFieldErrors(fieldErrors as z.ZodIssue[])
	}
}

builder.objectType(FieldErrors, {
	name: "FieldErrors",
	fields: (t) => ({
		fieldErrors: t.field({
			type: [FieldError],
			resolve: (root) => root.fieldErrors,
		}),
	}),
})
