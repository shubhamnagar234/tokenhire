import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
]

const PROTECTED_PREFIXES = [
  "/api/company",
  "/api/tests",
  "/api/problems",
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized — token missing" },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}