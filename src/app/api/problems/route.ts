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

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Look up the recruiter's company to scope the problem
    const recruiter = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { companyId: true },
    })

    // Create the problem with standard Prisma fields and relational scoping
    const problem = await prisma.problem.create({
      data: {
        title: data.title,
        description: data.description,
        difficulty: data.difficulty,
        tags: data.tags,
        companyId: recruiter?.companyId ?? undefined,
        createdById: user.userId,
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

export const GET = withAuth(async (req, user) => {
  // Find the recruiter's company
  const recruiter = await prisma.user.findUnique({
    where: { id: user.userId },
    select: { companyId: true },
  })

  // Scope problems to this company OR created by this user (backward compat).
  // Using Prisma ORM avoids the data-isolation bug that the raw SQL OR clause had.
  const problems = await prisma.problem.findMany({
    where: {
      OR: [
        ...(recruiter?.companyId ? [{ companyId: recruiter.companyId }] : []),
        { createdById: user.userId },
      ],
    },
    include: { testCases: true },
    orderBy: { title: "asc" },
  })

  return NextResponse.json({ problems })
}, "RECRUITER")