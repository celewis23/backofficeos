import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function GET() {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id

    // Get all sessions for the user from better-auth table
    const sessions = await db.session.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        token: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    const currentToken = session.session.token

    return NextResponse.json({
      sessions: sessions.map((s) => ({
        ...s,
        isCurrent: s.token === currentToken,
      })),
    })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id
    const { sessionId, revokeAll } = await request.json()
    const currentToken = session.session.token

    if (revokeAll) {
      // Revoke all except current session
      await db.session.deleteMany({
        where: { userId, token: { not: currentToken } },
      })
    } else if (sessionId) {
      // Only allow revoking own sessions
      await db.session.deleteMany({
        where: { id: sessionId, userId },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
