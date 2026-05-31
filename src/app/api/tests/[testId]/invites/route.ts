import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/auth/withAuth"
import { z } from "zod"

const schema = z.object({
  emails: z.array(z.string().email()).min(1).max(50),
  expiresInDays: z.number().default(7),
})

export const POST = withAuth(async (req, user) => {
  // extract testId from URL reliably
  const segments = new URL(req.url).pathname.split("/")
  const testId = segments[segments.indexOf("tests") + 1]

  const body = await req.json()
  const { emails, expiresInDays } = schema.parse(body)

  // verify recruiter owns this test
  const test = await prisma.test.findFirst({
    where: {
      id: testId,
      company: { users: { some: { id: user.userId } } },
    },
  })

  if (!test) {
    return NextResponse.json(
      { error: "Test not found or access denied" },
      { status: 403 }
    )
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  // create invites for all emails
  const invites = await Promise.all(
    emails.map((email) =>
      prisma.testInvite.create({
        data: { email, testId, expiresAt },
      })
    )
  )

  // build invite links
  const inviteLinks = invites.map((invite) => ({
    email: invite.email,
    token: invite.token,
    link: `${process.env.NEXT_PUBLIC_APP_URL}/test/${invite.token}`,
    expiresAt: invite.expiresAt,
  }))

  return NextResponse.json({ invites: inviteLinks })
}, "RECRUITER")

export const GET = withAuth(async (req) => {
  const url = new URL(req.url)
  const testId = url.pathname.split("/")[4]

  const invites = await prisma.testInvite.findMany({
    where: { testId },
    include: {
      candidate: { select: { name: true, email: true } },
      submission: { select: { scoreComposite: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ invites })
}, "RECRUITER")