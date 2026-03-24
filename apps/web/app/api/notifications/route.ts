import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function GET() {
  try {
    const { orgId, session } = await requireOrg()
    const userId = session.user.id

    const notifications = await db.notification.findMany({
      where: { organizationId: orgId, userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const unreadCount = notifications.filter((n) => !n.readAt).length

    return NextResponse.json({ notifications, unreadCount })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { orgId, session } = await requireOrg()
    const userId = session.user.id
    const body = await request.json()

    if (body.markAllRead) {
      await db.notification.updateMany({
        where: { organizationId: orgId, userId, readAt: null },
        data: { readAt: new Date() },
      })
    } else if (body.id) {
      await db.notification.update({
        where: { id: body.id, userId },
        data: { readAt: new Date() },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
