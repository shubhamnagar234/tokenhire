import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"

const schema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  timeLimitMins: z.number().min(10).max(180),
  tokenBudget: z.number().min(100).max(10000),
  companyId: z.string(),
  weightCorrectness: z.number().default(0.5),
  weightTime: z.number().default(0.2),
  weightTokenSaving: z.number().default(0.2),
  weightCodeQuality: z.number().default(0.1),
})

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // verify recruiter belongs to this company
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, users: { some: { id: user.userId } } },
    })

    if (!company) {
      return NextResponse.json(
        { error: "Company not found or access denied" },
        { status: 403 }
      )
    }

    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description,
        timeLimitMins: data.timeLimitMins,
        tokenBudget: data.tokenBudget,
        companyId: data.companyId,
        weightCorrectness: data.weightCorrectness,
        weightTime: data.weightTime,
        weightTokenSaving: data.weightTokenSaving,
        weightCodeQuality: data.weightCodeQuality,
      },
    })

    return NextResponse.json({ test })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}, "RECRUITER")

export const GET = withAuth(async (req, user) => {
  const tests = await prisma.test.findMany({
    where: {
      company: { users: { some: { id: user.userId } } },
    },
    include: { problems: true, invites: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ tests })
}, "RECRUITER")