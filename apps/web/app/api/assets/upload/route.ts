import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

const MAX_SIZE = 100 * 1024 * 1024 // 100MB

function getFileType(mime: string): string {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("font/") || mime.includes("font")) return "font"
  if (mime === "application/pdf" || mime.includes("document") || mime.includes("word") || mime.includes("spreadsheet") || mime.includes("presentation") || mime.includes("text/")) return "document"
  if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip") || mime.includes("rar") || mime.includes("7z")) return "archive"
  return "other"
}

export async function POST(req: NextRequest) {
  try {
    const { orgId, session } = await requireOrg()

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const folderId = formData.get("folderId") as string | null

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: "File too large (max 100MB)" }, { status: 400 })

    const ext = file.name.split(".").pop() ?? ""
    const storageKey = `${orgId}/${randomUUID()}.${ext}`
    const uploadDir = join(process.cwd(), "public", "uploads", orgId)
    const fileName = `${randomUUID()}.${ext}`
    const filePath = join(uploadDir, fileName)

    await mkdir(uploadDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    await writeFile(filePath, Buffer.from(bytes))

    const fileUrl = `/uploads/${orgId}/${fileName}`
    const fileType = getFileType(file.type)

    const asset = await db.asset.create({
      data: {
        organizationId: orgId,
        folderId: folderId || null,
        name: file.name.replace(/\.[^.]+$/, ""),
        originalName: file.name,
        fileUrl,
        storageKey,
        fileType,
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedBy: session.user.id,
        tags: [],
      },
    })

    return NextResponse.json({ success: true, asset })
  } catch (e) {
    console.error("Upload error:", e)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
