import { NextRequest } from "next/server"

export interface AuthUser {
  userId: string
  email: string
  role: "RECRUITER" | "CANDIDATE" | "ADMIN"
}

export const getUser = (req: NextRequest): AuthUser => {
  return {
    userId: req.headers.get("x-user-id")!,
    email: req.headers.get("x-user-email")!,
    role: req.headers.get("x-user-role") as AuthUser["role"],
  }
}