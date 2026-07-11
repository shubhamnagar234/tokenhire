import { NextRequest, NextResponse } from "next/server"
import { verifyToken, JWTPayload } from "@/lib/auth/jwt"

type RouteHandler = (
  req: NextRequest,
  user: JWTPayload
) => Promise<NextResponse>

export const withAuth = (
  handler: RouteHandler,
  requiredRole?: "RECRUITER" | "CANDIDATE" | "ADMIN"
) => {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = req.cookies.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized — no auth token" },
        { status: 401 }
      )
    }

    try {
      const user = verifyToken(token)

      if (requiredRole && user.role !== requiredRole) {
        return NextResponse.json(
          { error: "Forbidden — insufficient role" },
          { status: 403 }
        )
      }

      return handler(req, user)
    } catch {
      return NextResponse.json(
        { error: "Unauthorized — invalid token" },
        { status: 401 }
      )
    }
  }
}