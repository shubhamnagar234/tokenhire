import jwt from "jsonwebtoken"
import { config } from "../config"

const JWT_SECRET = config.JWT_SECRET
const JWT_EXPIRES_IN = "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: "RECRUITER" | "CANDIDATE" | "ADMIN"
}

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}