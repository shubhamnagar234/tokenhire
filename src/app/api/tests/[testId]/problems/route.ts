import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { z } from "zod";

const addSchema = z.object({
  problemId: z.string(),
  order: z.number().default(1),
});

const removeSchema = z.object({ problemId: z.string() });

export const POST = withAuth(async (req, user, context) => {
  const { testId } = await context.params;

  try {
    const body = await req.json();
    const { problemId, order } = addSchema.parse(body);

    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        company: { users: { some: { id: user.userId } } },
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 403 },
      );
    }

    // Verify problem exists AND belongs to the recruiter's company (or created by them)
    const problem = await prisma.problem.findFirst({
      where: {
        id: problemId,
        OR: [
          { companyId: test.companyId },
          { createdById: user.userId },
        ],
      },
    });

    if (!problem) {
      return NextResponse.json(
        { error: "Problem not found or access denied" },
        { status: 403 },
      );
    }

    const testProblem = await prisma.testProblem.create({
      data: { testId, problemId, order },
      include: { problem: true },
    });

    return NextResponse.json({ testProblem });
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

export const DELETE = withAuth(async (req, user, context) => {
  const { testId } = await context.params;

  try {
    const body = await req.json();
    const { problemId } = removeSchema.parse(body);

    // verify ownership
    const test = await prisma.test.findFirst({
      where: { id: testId, company: { users: { some: { id: user.userId } } } },
    });

    if (!test) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.testProblem.deleteMany({ where: { testId, problemId } });

    return NextResponse.json({ success: true });
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

export const GET = withAuth(async (req, user, context) => {
  const { testId } = await context.params;

  // verify ownership
  const test = await prisma.test.findFirst({
    where: { id: testId, company: { users: { some: { id: user.userId } } } },
  });

  if (!test) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const problems = await prisma.testProblem.findMany({
    where: { testId },
    include: {
      problem: {
        include: { testCases: { select: { id: true } } },
      },
    },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ problems });
}, "RECRUITER");
