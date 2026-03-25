"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { unlink } from "fs/promises"
import { join } from "path"

// ─── Folders ─────────────────────────────────────────────────

export async function createFolder(name: string, parentId?: string) {
  const { orgId } = await requireOrg()
  await db.assetFolder.create({
    data: { organizationId: orgId, name, parentId: parentId || null },
  })
  revalidatePath("/assets")
  return { success: true }
}

export async function renameFolder(id: string, name: string) {
  const { orgId } = await requireOrg()
  await db.assetFolder.updateMany({ where: { id, organizationId: orgId }, data: { name } })
  revalidatePath("/assets")
  return { success: true }
}

export async function moveFolder(id: string, newParentId: string | null) {
  const { orgId } = await requireOrg()
  await db.assetFolder.updateMany({
    where: { id, organizationId: orgId },
    data: { parentId: newParentId },
  })
  revalidatePath("/assets")
  return { success: true }
}

export async function deleteFolder(id: string) {
  const { orgId } = await requireOrg()
  // Move all assets in this folder to root
  await db.asset.updateMany({ where: { folderId: id, organizationId: orgId }, data: { folderId: null } })
  await db.assetFolder.deleteMany({ where: { id, organizationId: orgId, isSystemFolder: false } })
  revalidatePath("/assets")
  return { success: true }
}

// ─── Assets ──────────────────────────────────────────────────

export async function renameAsset(id: string, name: string) {
  const { orgId } = await requireOrg()
  await db.asset.updateMany({ where: { id, organizationId: orgId }, data: { name } })
  revalidatePath("/assets")
  return { success: true }
}

export async function moveAsset(id: string, folderId: string | null) {
  const { orgId } = await requireOrg()
  await db.asset.updateMany({ where: { id, organizationId: orgId }, data: { folderId } })
  revalidatePath("/assets")
  return { success: true }
}

export async function updateAssetTags(id: string, tags: string[]) {
  const { orgId } = await requireOrg()
  await db.asset.updateMany({
    where: { id, organizationId: orgId },
    data: { tags: JSON.parse(JSON.stringify(tags)) },
  })
  revalidatePath("/assets")
  return { success: true }
}

export async function updateAssetPublicLink(
  id: string,
  opts: { isPublic: boolean; expiresAt?: string | null; password?: string | null }
) {
  const { orgId } = await requireOrg()
  await db.asset.updateMany({
    where: { id, organizationId: orgId },
    data: {
      isPublic: opts.isPublic,
      publicExpiresAt: opts.expiresAt ? new Date(opts.expiresAt) : null,
      publicPassword: opts.password || null,
    },
  })
  revalidatePath("/assets")
  return { success: true }
}

export async function deleteAsset(id: string) {
  const { orgId } = await requireOrg()
  const asset = await db.asset.findFirst({ where: { id, organizationId: orgId } })
  if (!asset) return { error: "Not found" }

  // Delete from filesystem if local
  if (asset.fileUrl.startsWith("/uploads/")) {
    try {
      const filePath = join(process.cwd(), "public", asset.fileUrl)
      await unlink(filePath)
    } catch {
      // Non-fatal — file may not exist
    }
  }

  await db.asset.delete({ where: { id } })
  revalidatePath("/assets")
  return { success: true }
}

export async function linkAssetToEntity(
  assetId: string,
  entityType: string,
  entityId: string
) {
  const { orgId } = await requireOrg()
  await db.asset.updateMany({
    where: { id: assetId, organizationId: orgId },
    data: { linkedEntityType: entityType, linkedEntityId: entityId },
  })
  revalidatePath("/assets")
  return { success: true }
}

// Ensure Brand Kit system folders exist
export async function ensureBrandKit() {
  const { orgId } = await requireOrg()

  const existing = await db.assetFolder.findFirst({
    where: { organizationId: orgId, name: "Brand Kit", isSystemFolder: true },
  })
  if (existing) return { id: existing.id }

  const kit = await db.assetFolder.create({
    data: {
      organizationId: orgId,
      name: "Brand Kit",
      isSystemFolder: true,
      sortOrder: -1,
    },
  })

  await db.assetFolder.createMany({
    data: [
      { organizationId: orgId, parentId: kit.id, name: "Logo", isSystemFolder: true, sortOrder: 0 },
      { organizationId: orgId, parentId: kit.id, name: "Fonts", isSystemFolder: true, sortOrder: 1 },
      { organizationId: orgId, parentId: kit.id, name: "Colors", isSystemFolder: true, sortOrder: 2 },
      { organizationId: orgId, parentId: kit.id, name: "Templates", isSystemFolder: true, sortOrder: 3 },
    ],
  })

  revalidatePath("/assets")
  return { id: kit.id }
}

// Import from external source (Google Drive / OneDrive)
const importSchema = z.object({
  name: z.string().min(1),
  fileUrl: z.string().url(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
  folderId: z.string().optional(),
  sourceProvider: z.enum(["google_drive", "onedrive"]),
  sourceFileId: z.string(),
})

export async function importExternalFile(data: unknown) {
  const { orgId, session } = await requireOrg()
  const parsed = importSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  function getFileType(mime: string): string {
    if (mime.startsWith("image/")) return "image"
    if (mime.startsWith("video/")) return "video"
    if (mime.startsWith("font/") || mime.includes("font")) return "font"
    if (mime === "application/pdf" || mime.includes("document") || mime.includes("word") || mime.includes("text/")) return "document"
    if (mime.includes("zip") || mime.includes("tar") || mime.includes("gzip")) return "archive"
    return "other"
  }

  await db.asset.create({
    data: {
      organizationId: orgId,
      folderId: parsed.data.folderId || null,
      name: parsed.data.name,
      originalName: parsed.data.name,
      fileUrl: parsed.data.fileUrl,
      storageKey: `external/${parsed.data.sourceProvider}/${parsed.data.sourceFileId}`,
      fileType: getFileType(parsed.data.mimeType),
      mimeType: parsed.data.mimeType,
      sizeBytes: parsed.data.sizeBytes,
      uploadedBy: session.user.id,
      tags: [],
      sourceProvider: parsed.data.sourceProvider,
      sourceFileId: parsed.data.sourceFileId,
    },
  })

  revalidatePath("/assets")
  return { success: true }
}
