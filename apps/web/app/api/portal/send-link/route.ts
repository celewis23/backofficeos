import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await requireOrg()
    const { clientId } = await request.json()

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 })
    }

    // Verify client belongs to this org
    const client = await db.client.findUnique({
      where: { id: clientId, organizationId: orgId },
      select: { id: true, name: true, email: true, portalEnabled: true },
    })

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }

    // Upsert: expire any existing tokens, create a new one
    await db.clientPortalToken.deleteMany({ where: { clientId } })

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    const portalToken = await db.clientPortalToken.create({
      data: { clientId, expiresAt },
    })

    // Enable portal access on the client
    await db.client.update({
      where: { id: clientId },
      data: { portalEnabled: true },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const portalUrl = `${appUrl}/portal/${portalToken.token}`

    return NextResponse.json({ success: true, portalUrl, token: portalToken.token })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
