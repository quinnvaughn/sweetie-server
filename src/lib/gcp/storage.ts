import { config } from "../../config"
import { Storage } from "@google-cloud/storage"

const private_key = config.GOOGLE_CREDENTIALS_PRIVATE_KEY.replace(/\\n/gm, "\n")

export const storage = new Storage({
	credentials: {
		private_key,
		client_email: config.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
	},
	projectId: config.GOOGLE_CLOUD_PROJECT_ID,
})

const bucket = storage.bucket(config.IMAGE_BUCKET)

export async function generateUploadSignedUrl(
	filename: string,
	contentType?: string,
) {
	// replace all spaces with dashes
	filename = filename.replace(/ /g, "-")
	// Get a v4 signed URL for uploading file
	const [url] = await bucket.file(filename).getSignedUrl({
		version: "v4",
		action: "write",
		expires: Date.now() + 15 * 60 * 1000, // 15 minutes
		contentType: contentType ?? "application/octet-stream",
	})
	return url
}

export async function deleteFile(filename: string) {
	await bucket.file(filename).delete()
}
