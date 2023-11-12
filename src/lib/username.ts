import crypto from "crypto"

/**
 * Generates a random username string
 * @param length The length of the string to generate
 * @returns A random string of the specified length
 */
export function generateUsernameString(length: number): string {
	return crypto.randomBytes(length / 2).toString("hex")
}
