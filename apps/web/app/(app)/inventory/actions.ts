"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { createNotification } from "@/lib/notifications"

const itemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  costPrice: z.coerce.number().min(0).optional(),
  sellPrice: z.coerce.number().min(0).optional(),
  stockQuantity: z.coerce.number().int().min(0).default(0),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  unit: z.string().optional(),
})

export async function createInventoryItem(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = itemSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.inventoryItem.create({
    data: { organizationId: orgId, ...parsed.data },
  })

  revalidatePath("/inventory")
  return { success: true }
}

export async function updateInventoryItem(id: string, data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = itemSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.inventoryItem.updateMany({
    where: { id, organizationId: orgId },
    data: parsed.data,
  })

  revalidatePath("/inventory")
  return { success: true }
}

export async function deleteInventoryItem(id: string) {
  const { orgId } = await requireOrg()
  await db.inventoryItem.updateMany({
    where: { id, organizationId: orgId },
    data: { isActive: false },
  })
  revalidatePath("/inventory")
  return { success: true }
}

const movementSchema = z.object({
  itemId: z.string(),
  type: z.enum(["SALE", "RESTOCK", "ADJUSTMENT", "RETURN", "TRANSFER"]),
  quantityChange: z.coerce.number().int(),
  notes: z.string().optional(),
  referenceId: z.string().optional(),
  referenceType: z.string().optional(),
})

export async function addInventoryMovement(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = movementSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const item = await db.inventoryItem.findFirst({
    where: { id: parsed.data.itemId, organizationId: orgId },
  })
  if (!item) return { error: "Item not found" }

  await db.inventoryMovement.create({
    data: {
      organizationId: orgId,
      itemId: parsed.data.itemId,
      type: parsed.data.type,
      quantityChange: parsed.data.quantityChange,
      notes: parsed.data.notes,
      referenceId: parsed.data.referenceId,
      referenceType: parsed.data.referenceType,
    },
  })

  const newQty = item.stockQuantity + parsed.data.quantityChange
  await db.inventoryItem.update({
    where: { id: item.id },
    data: { stockQuantity: Math.max(0, newQty) },
  })

  // Low-stock notification
  if (newQty <= item.lowStockThreshold) {
    await createNotification({
      organizationId: orgId,
      type: "TASK_DUE_SOON",
      title: "Low stock alert",
      body: `"${item.name}" is low on stock (${newQty} remaining).`,
      entityType: "inventory_item",
      entityId: item.id,
    })
  }

  revalidatePath("/inventory")
  return { success: true }
}
