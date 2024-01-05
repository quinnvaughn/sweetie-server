import { sign, verify } from "jsonwebtoken"
import { config } from "../config"

export function generatePasswordResetToken(id: string): string {
	return sign({ id }, config.JWT_SECRET, { expiresIn: "10m" })
}

type ResetToken = {
	id: string
}

export function verifyPasswordResetToken(
	token: string,
): ResetToken | undefined {
	try {
		return verify(token, config.JWT_SECRET) as ResetToken
	} catch (e) {
		return undefined
	}
}
