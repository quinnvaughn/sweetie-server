import { Resend } from "resend"
import { config } from "../config"

const resend = new Resend(config.RESEND_API_KEY)

export { resend }
