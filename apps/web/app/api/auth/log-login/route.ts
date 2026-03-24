import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ ok: false }, { status: 401 })

    const userId = session.user.id
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null
    const userAgent = request.headers.get("user-agent") ?? null

    await db.loginEvent.create({
      data: { userId, ipAddress, userAgent, success: true },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
