import type { Metadata } from "next"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { InventoryClient } from "./inventory-client"

export const metadata: Metadata = { title: "Inventory — ArcheionOS" }

export default async function InventoryPage() {
  const { orgId } = await requireOrg()

  const items = await db.inventoryItem.findMany({
    where: { organizationId: orgId, isActive: true },
    include: {
      movements: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const lowStockCount = items.filter(
    (i) => i.stockQuantity <= i.lowStockThreshold
  ).length

  return (
    <InventoryClient
      items={items}
      stats={{ totalItems: items.length, lowStockCount }}
    />
  )
}
