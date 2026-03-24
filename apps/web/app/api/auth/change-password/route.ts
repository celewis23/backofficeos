import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { auth } from "@backoffice-os/auth"

export async function POST(request: NextRequest) {
  try {
    await requireOrg()
    const { currentPassword, newPassword } = await request.json()

    // Delegate to better-auth's built-in change password
    const res = await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: false },
      headers: request.headers,
    })

    if (!res) {
      return NextResponse.json({ error: "Failed to update password" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unauthorized"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
