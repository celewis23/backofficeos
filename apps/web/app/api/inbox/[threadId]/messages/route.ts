import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
) {
  let orgId: string
  try {
    const result = await requireOrg()
    orgId = result.orgId
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { threadId } = await params

  const thread = await db.thread.findFirst({
    where: { id: threadId, organizationId: orgId },
  })

  if (!thread) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = await db.message.findMany({
    where: { threadId },
    orderBy: { sentAt: "asc" },
    select: {
      id: true,
      from: true,
      to: true,
      cc: true,
      body: true,
      htmlBody: true,
      sentAt: true,
      isRead: true,
    },
  })

  return NextResponse.json(messages)
}
