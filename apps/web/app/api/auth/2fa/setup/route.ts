import { NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { authenticator } from "otplib"
import QRCode from "qrcode"

export async function POST() {
  try {
    const { session } = await requireOrg()
    const userId = session.user.id
    const userEmail = session.user.email

    // Generate a new TOTP secret
    const secret = authenticator.generateSecret()

    // Build the otpauth URL for QR code
    const otpauthUrl = authenticator.keyuri(userEmail, "ArcheionOS", secret)

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)

    // Store secret temporarily (not yet verified/enabled)
    await db.userTwoFactor.upsert({
      where: { userId },
      create: { userId, secret, enabled: false },
      update: { secret, enabled: false },
    })

    return NextResponse.json({ qrCode: qrCodeDataUrl, secret })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
