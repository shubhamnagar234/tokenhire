import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/auth/password"
import { signToken } from "@/lib/auth/jwt"
import { z } from "zod"

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["RECRUITER", "CANDIDATE"]),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, role } = registerSchema.parse(body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Email already in use" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        ...(role === "RECRUITER"
          ? {
              company: {
                create: { name: "My Company" },
              },
            }
          : {}),
      },
    })

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    const cookieStore = await cookies()
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}