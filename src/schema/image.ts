import * as Sentry from "@sentry/node"
import { builder } from "../builder"
import { deleteFile, generateUploadSignedUrl } from "../lib"
import { AuthError } from "./error"

const GeneratePresignedUrlInput = builder.inputType(
	"GeneratePresignedUrlInput",
	{
		fields: (t) => ({
			folder: t.string({ required: true }),
			filename: t.string({ required: true }),
			contentType: t.string(),
		}),
	},
)

const DeleteImageInput = builder.inputType("DeleteImageInput", {
	fields: (t) => ({
		folder: t.string({ required: true }),
		filename: t.string({ required: true }),
	}),
})

builder.mutationFields((t) => ({
	deleteImage: t.field({
		type: "Boolean",
		errors: {
			types: [AuthError],
			directResult: false,
		},
		args: {
			input: t.arg({ type: DeleteImageInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in")
			}
			const { folder, filename } = input
			// I don't think we need to check this because it just returns false if it doesn't exist
			const fileName = `${currentUser.id}/${folder}/${filename}`
			try {
				await deleteFile(fileName)
				return true
			} catch (e) {
				Sentry.setUser({ id: currentUser.id, email: currentUser.email })
				Sentry.captureException(e)
				return false
			}
		},
	}),
	generatePresignedUrl: t.field({
		type: "String",
		errors: {
			types: [AuthError],
			directResult: false,
		},
		args: {
			input: t.arg({ type: GeneratePresignedUrlInput, required: true }),
		},
		resolve: async (_p, { input }, { currentUser }) => {
			if (!currentUser) {
				throw new AuthError("You must be logged in")
			}
			const { folder, filename } = input

			// this is mostly because I want images to be jpgs and not pngs
			const extension = filename.split(".").pop()
			const noExtension = filename.replace(`.${extension}`, "")
			const contentType = input.contentType?.split("/").pop()

			const fileName = `${
				currentUser.id
			}/${folder}/${Date.now()}-${noExtension}.${contentType}`

			return generateUploadSignedUrl(
				fileName,
				input.contentType ?? "application/octet-stream",
			)
		},
	}),
}))
