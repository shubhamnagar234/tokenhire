import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
});

export const PATCH = withAuth(async (req, user, context) => {
  try {
    const { testId } = await context.params;

    const body = await req.json();
    const { status } = schema.parse(body);

    // verify recruiter owns this test
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

    // Enforce valid transitions:  DRAFT→ACTIVE, ACTIVE→CLOSED, ACTIVE→DRAFT
    const allowed: Record<string, string[]> = {
      DRAFT: ["ACTIVE"],
      ACTIVE: ["CLOSED", "DRAFT"],
      CLOSED: [],
    };

    if (!allowed[test.status].includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${test.status} to ${status}` },
        { status: 400 },
      );
    }

    const updated = await prisma.test.update({
      where: { id: testId },
      data: { status },
    });

    return NextResponse.json({ test: updated });
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
  try {
    const { testId } = await context.params;

    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        company: { users: { some: { id: user.userId } } },
      },
      include: {
        problems: { include: { problem: true } },
        invites: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 403 },
      );
    }

    return NextResponse.json({ test });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}, "RECRUITER");
