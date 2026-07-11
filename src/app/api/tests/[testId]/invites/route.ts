import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth/withAuth";
import { z } from "zod";
import { sendInviteEmail } from "@/lib/email";

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  expiresInDays: z.number().default(7),
});

export const POST = withAuth(async (req, user, context) => {
  const { testId } = await context.params;

  try {
    const body = await req.json();
    const { emails, expiresInDays } = schema.parse(body);

    // verify recruiter owns this test
    const test = await prisma.test.findFirst({
      where: {
        id: testId,
        company: { users: { some: { id: user.userId } } },
      },
      include: { company: true },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found or access denied" },
        { status: 403 },
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Block duplicate invites — check if any submitted email already has
    // an active (non-expired, non-completed) invite for this test
    const duplicates = await prisma.testInvite.findMany({
      where: {
        testId,
        email: { in: emails },
        status: { in: ["PENDING", "ACCEPTED"] },
        expiresAt: { gt: new Date() },
      },
      select: { email: true },
    });

    if (duplicates.length > 0) {
      const dupeEmails = duplicates.map((d) => d.email);
      return NextResponse.json(
        {
          error: `Active invite already exists for: ${dupeEmails.join(", ")}. Revoke it first before re-inviting.`,
        },
        { status: 409 },
      );
    }

    // create invites for all emails
    const invites = await Promise.all(
      emails.map((email) =>
        prisma.testInvite.create({
          data: { email, testId, expiresAt },
        }),
      ),
    );

    // build invite links
    const inviteLinks = invites.map((invite) => ({
      email: invite.email,
      token: invite.token,
      link: `${process.env.NEXT_PUBLIC_APP_URL}/test/${invite.token}`,
      expiresAt: invite.expiresAt,
    }));

    // send emails asynchronously (don't block the response)
    Promise.all(
      inviteLinks.map((invite) =>
        sendInviteEmail(invite.email, test.title, invite.link, test.company.name)
      )
    ).catch((err) => console.error("Failed to send invite emails", err));

    return NextResponse.json({ invites: inviteLinks });
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

  const invites = await prisma.testInvite.findMany({
    where: { testId },
    include: {
      candidate: { select: { name: true, email: true } },
      submission: { select: { scoreComposite: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invites });
}, "RECRUITER");

const revokeSchema = z.object({ inviteId: z.string() });

export const DELETE = withAuth(async (req, user, context) => {
  const { testId } = await context.params;
  try {
    const body = await req.json();
    const { inviteId } = revokeSchema.parse(body);

    // verify ownership
    const invite = await prisma.testInvite.findFirst({
      where: {
        id: inviteId,
        testId,
        test: { company: { users: { some: { id: user.userId } } } },
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invite not found or access denied" },
        { status: 403 },
      );
    }

    if (invite.status === "COMPLETED") {
      return NextResponse.json(
        { error: "Cannot revoke a completed invite" },
        { status: 400 },
      );
    }

    // Expire the invite (preserve history, just block access)
    await prisma.testInvite.update({
      where: { id: inviteId },
      data: { status: "EXPIRED", expiresAt: new Date() },
    });

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
