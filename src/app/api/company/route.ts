import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
})

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const { name } = schema.parse(body)

    const company = await prisma.company.create({
      data: {
        name,
        users: { connect: { id: user.userId } },
      },
    })

    return NextResponse.json({ company })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "RECRUITER")