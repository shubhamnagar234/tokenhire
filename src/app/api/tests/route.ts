import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { z } from "zod";

const schema = z
  .object({
    title: z.string().min(3),
    description: z.string().optional(),
    timeLimitMins: z.number().min(10).max(180),
    tokenBudget: z.number().min(100).max(10000),
    weightCorrectness: z.number().default(0.5),
    weightTime: z.number().default(0.2),
    weightTokenSaving: z.number().default(0.2),
    weightCodeQuality: z.number().default(0.1),
    aiModel: z.string().default("google/gemini-2.5-flash:free"),
  })
  .refine(
    (d) =>
      Math.abs(
        d.weightCorrectness +
          d.weightTime +
          d.weightTokenSaving +
          d.weightCodeQuality -
          1.0,
      ) < 0.01,
    { message: "Scoring weights must sum to 1.0" },
  );

export const POST = withAuth(async (req, user) => {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // fetch recruiter's own company — prevents IDOR and company-overwrite bugs
    const recruiter = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { companyId: true },
    });

    if (!recruiter?.companyId) {
      return NextResponse.json(
        { error: "Recruiter has no associated company" },
        { status: 403 },
      );
    }

    const test = await prisma.test.create({
      data: {
        title: data.title,
        description: data.description,
        timeLimitMins: data.timeLimitMins,
        tokenBudget: data.tokenBudget,
        companyId: recruiter.companyId,
        weightCorrectness: data.weightCorrectness,
        weightTime: data.weightTime,
        weightTokenSaving: data.weightTokenSaving,
        weightCodeQuality: data.weightCodeQuality,
        aiModel: data.aiModel,
      },
    });

    return NextResponse.json({ test });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 422 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, "RECRUITER");

export const GET = withAuth(async (req, user) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.max(
    1,
    Math.min(100, parseInt(searchParams.get("limit") || "10")),
  );
  const skip = (page - 1) * limit;

  const where = {
    company: { users: { some: { id: user.userId } } },
  };

  const [tests, total] = await Promise.all([
    prisma.test.findMany({
      where,
      include: { problems: true, invites: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.test.count({ where }),
  ]);

  return NextResponse.json({
    tests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, "RECRUITER");
