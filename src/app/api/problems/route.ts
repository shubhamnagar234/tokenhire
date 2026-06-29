import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  tags: z.array(z.string()).default([]),
  testCases: z.array(z.object({
    input: z.string(),
    expected: z.string(),
    isHidden: z.boolean().default(false),
  })).min(1),
})

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        testCases: {
          create: data.testCases,
        },
      },
      include: { testCases: true },
    })

    return NextResponse.json({ problem })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "RECRUITER")

export const GET = withAuth(async () => {
  const problems = await prisma.problem.findMany({
    include: { testCases: true },
    orderBy: { title: "asc" },
  })

  return NextResponse.json({ problems })
}, "RECRUITER")