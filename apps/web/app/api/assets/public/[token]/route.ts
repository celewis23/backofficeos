import { NextRequest, NextResponse } from "next/server"
import { db } from "@backoffice-os/database"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const asset = await db.asset.findUnique({
    where: { publicToken: token },
    select: {
      isPublic: true,
      fileUrl: true,
      originalName: true,
      mimeType: true,
      publicExpiresAt: true,
      publicPassword: true,
    },
  })

  if (!asset || !asset.isPublic) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (asset.publicExpiresAt && new Date(asset.publicExpiresAt) < new Date()) {
    return NextResponse.json({ error: "Link expired" }, { status: 410 })
  }

  const password = req.nextUrl.searchParams.get("pw")
  if (asset.publicPassword && asset.publicPassword !== password) {
    return NextResponse.json({ error: "Password required" }, { status: 401 })
  }

  // Redirect to the file URL
  return NextResponse.redirect(new URL(asset.fileUrl, req.url))
}
