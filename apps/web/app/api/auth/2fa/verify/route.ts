import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { authenticator } from "otplib"

// Get current 2FA status
export async function GET() {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id
    const record = await db.userTwoFactor.findUnique({ where: { userId } })
    return NextResponse.json({ enabled: record?.enabled ?? false })
  } catch {
    return NextResponse.json({ enabled: false })
  }
}

// Verify and enable 2FA
export async function POST(request: NextRequest) {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id
    const { code } = await request.json()

    const record = await db.userTwoFactor.findUnique({ where: { userId } })
    if (!record) {
      return NextResponse.json({ error: "No 2FA setup in progress" }, { status: 400 })
    }

    const isValid = authenticator.verify({ token: code, secret: record.secret })
    if (!isValid) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 })
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).slice(2, 8).toUpperCase()
    )

    await db.userTwoFactor.update({
      where: { userId },
      data: { enabled: true, backupCodes: JSON.stringify(backupCodes) },
    })

    return NextResponse.json({ success: true, backupCodes })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

// Disable 2FA
export async function DELETE() {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id

    await db.userTwoFactor.deleteMany({ where: { userId } })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
