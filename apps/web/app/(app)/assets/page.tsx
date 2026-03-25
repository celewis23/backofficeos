import type { Metadata } from "next"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { AssetsClient } from "./assets-client"
import { ensureBrandKit } from "./actions"

export const metadata: Metadata = { title: "Assets — ArcheionOS" }

export default async function AssetsPage() {
  const { orgId, session } = await requireOrg()

  // Ensure Brand Kit system folders are created
  await ensureBrandKit()

  const [folders, assets, storageAgg] = await Promise.all([
    db.assetFolder.findMany({
      where: { organizationId: orgId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    db.asset.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
    }),
    db.asset.aggregate({
      where: { organizationId: orgId },
      _sum: { sizeBytes: true },
      _count: { id: true },
    }),
  ])

  const storageUsedBytes = storageAgg._sum.sizeBytes ?? 0
  const totalAssets = storageAgg._count.id

  return (
    <AssetsClient
      folders={folders}
      assets={assets}
      storageUsedBytes={storageUsedBytes}
      totalAssets={totalAssets}
      currentUserId={session.user.id}
    />
  )
}
