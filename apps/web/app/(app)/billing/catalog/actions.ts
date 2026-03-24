"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  type: z.enum(["SERVICE", "PRODUCT", "SUBSCRIPTION"]),
  unitPrice: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  taxable: z.boolean().default(true),
  unit: z.string().optional(),
  isRecurring: z.boolean().default(false),
})

export async function createProduct(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const product = await db.product.create({
    data: { organizationId: orgId, ...parsed.data, unitPrice: parsed.data.unitPrice },
  })

  revalidatePath("/billing/catalog")
  return { success: true, id: product.id }
}

export async function updateProduct(id: string, data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = productSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.product.updateMany({
    where: { id, organizationId: orgId },
    data: { ...parsed.data },
  })

  revalidatePath("/billing/catalog")
  return { success: true }
}

export async function archiveProduct(id: string) {
  const { orgId } = await requireOrg()
  await db.product.updateMany({
    where: { id, organizationId: orgId },
    data: { isActive: false },
  })
  revalidatePath("/billing/catalog")
  return { success: true }
}

export async function deleteProduct(id: string) {
  const { orgId } = await requireOrg()
  await db.product.deleteMany({ where: { id, organizationId: orgId } })
  revalidatePath("/billing/catalog")
  return { success: true }
}
