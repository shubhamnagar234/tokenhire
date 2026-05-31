import { NextRequest, NextResponse } from "next/server"

const PUBLIC_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
]

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // coarse token check on all API routes
  if (pathname.startsWith("/api")) {
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