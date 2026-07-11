import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"
import { Prisma } from "@prisma/client"

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

    // Create the problem with standard Prisma fields
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

    // Patch the company scope fields via raw SQL (avoids stale Prisma type cache)
    await prisma.$executeRaw`
      UPDATE "Problem"
      SET "companyId" = ${recruiter?.companyId ?? null},
          "createdById" = ${user.userId}
      WHERE id = ${problem.id}
    `

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

  // Scope problems to this company only using raw SQL to avoid stale Prisma type cache.
  // Returns problems with matching companyId OR created by this user (backward compat).
  const problems = await prisma.$queryRaw<Prisma.ProblemGetPayload<{ include: { testCases: true } }>[]>`
    SELECT p.*,
           COALESCE(
             json_agg(tc.*) FILTER (WHERE tc.id IS NOT NULL),
             '[]'
           ) AS "testCases"
    FROM "Problem" p
    LEFT JOIN "TestCase" tc ON tc."problemId" = p.id
    WHERE
      ${recruiter?.companyId
        ? Prisma.sql`p."companyId" = ${recruiter.companyId}`
        : Prisma.sql`p."createdById" = ${user.userId}`}
      OR p."createdById" = ${user.userId}
    GROUP BY p.id
    ORDER BY p.title ASC
  `

  return NextResponse.json({ problems })
}, "RECRUITER")