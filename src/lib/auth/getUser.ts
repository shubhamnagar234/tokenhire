import { NextRequest } from "next/server"
import { verifyToken, JWTPayload } from "./jwt"

export const getUser = (req: NextRequest): JWTPayload | null => {
  const token = req.cookies.get("auth_token")?.value
  if (!token) return null
  
  try {
    return verifyToken(token)
  } catch {
    return null
  }
}