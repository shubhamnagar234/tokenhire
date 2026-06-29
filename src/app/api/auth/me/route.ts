import { NextResponse } from "next/server"
import { withAuth } from "@/lib/auth/withAuth"
import { prisma } from "@/lib/prisma"

export const GET = withAuth(async (req, userPayload) => {
  const user = await prisma.user.findUnique({
    where: { id: userPayload.userId },
    select: { id: true, name: true, email: true, role: true }
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  return NextResponse.json({ user })
})
