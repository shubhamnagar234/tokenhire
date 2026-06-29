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
  const token = req.cookies.get("auth_token")?.value

  // Check Dashboard Protection
  if (pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    try {
      const parts = token.split(".")
      if (parts.length !== 3) throw new Error("Invalid token format")

      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
      while (base64.length % 4) {
        base64 += "="
      }
      
      const payloadStr = atob(base64)
      const payload = JSON.parse(payloadStr)

      if (payload.role !== "RECRUITER") {
        return NextResponse.redirect(new URL("/", req.url))
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Check API Route Protection
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized — token missing" },
        { status: 401 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
}