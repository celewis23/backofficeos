import { NextRequest, NextResponse } from "next/server"
import { db } from "@backoffice-os/database"

export async function POST(request: NextRequest) {
  try {
    const { token, subject, body } = await request.json()

    if (!token || !body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const portalToken = await db.clientPortalToken.findUnique({
      where: { token },
      select: {
        clientId: true,
        expiresAt: true,
        client: { select: { organizationId: true, name: true, email: true } },
      },
    })

    if (!portalToken || portalToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 })
    }

    const { clientId, client } = portalToken
    const orgId = client.organizationId

    // Create a new thread (or find existing open portal thread for today)
    const thread = await db.thread.create({
      data: {
        organizationId: orgId,
        clientId,
        subject: subject || `Message from ${client.name}`,
        type: "INTERNAL",
        lastMessageAt: new Date(),
      },
    })

    await db.message.create({
      data: {
        threadId: thread.id,
        from: client.email ?? client.name,
        body,
        sentAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, threadId: thread.id })
  } catch {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
