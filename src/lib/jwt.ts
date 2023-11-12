import { config } from "../config"
import { Role } from "@prisma/client"
import { sign, verify } from "jsonwebtoken"

export function createToken(
	id: string,
	role: Role["name"],
	username: string,
): string {
	return sign({ id, role, username }, config.JWT_SECRET)
}

type Token = {
	id: string
	role: Role["name"]
	username: string
}

export function verifyToken(token: string): Token | undefined {
	try {
		return verify(token, config.JWT_SECRET) as Token
	} catch (e) {
		return undefined
	}
}

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
