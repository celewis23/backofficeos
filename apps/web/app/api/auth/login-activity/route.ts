import { NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function GET() {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id

    const events = await db.loginEvent.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
