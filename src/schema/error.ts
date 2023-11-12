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

export class EntityNotFoundError extends Error {
	constructor(entity: string) {
		super(`${entity} not found`)

		this.name = "EntityNotFoundError"
	}
}

builder.objectType(EntityNotFoundError, {
	name: "EntityNotFoundError",
	fields: (t) => ({
		message: t.exposeString("message"),
	}),
})

export class EntityCreationError extends Error {
	constructor(entity: string) {
		super(`Unable to create ${entity}`)

		this.name = "EntityCreationError"
	}
}

builder.objectType(EntityCreationError, {
	name: "EntityCreationError",
	fields: (t) => ({
		message: t.exposeString("message"),
	}),
})

export class EntityUpdateError extends Error {
	constructor(entity: string) {
		super(`Unable to update ${entity}`)

		this.name = "EntityUpdateError"
	}
}

builder.objectType(EntityUpdateError, {
	name: "EntityUpdateError",
	fields: (t) => ({
		message: t.exposeString("message"),
	}),
})

export class EntityDeletionError extends Error {
	constructor(entity: string) {
		super(`Unable to delete ${entity}`)

		this.name = "EntityDeletionError"
	}
}

builder.objectType(EntityDeletionError, {
	name: "EntityDeletionError",
	fields: (t) => ({
		message: t.exposeString("message"),
	}),
})
