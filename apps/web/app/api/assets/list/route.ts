import { NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export async function GET() {
  try {
    const { orgId } = await requireOrg()
    const assets = await db.asset.findMany({
      where: { organizationId: orgId },
      select: {
        id: true,
        name: true,
        fileUrl: true,
        fileType: true,
        mimeType: true,
        sizeBytes: true,
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ assets })
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
