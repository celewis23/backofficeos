"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

const connectSchema = z.object({
  platform: z.string().min(1),
  category: z.string().min(1),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  externalId: z.string().optional(),
})

export async function connectPlatform(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = connectSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.platformConnection.upsert({
    where: { organizationId_platform: { organizationId: orgId, platform: parsed.data.platform } },
    create: {
      organizationId: orgId,
      platform: parsed.data.platform,
      category: parsed.data.category,
      apiKey: parsed.data.apiKey,
      accessToken: parsed.data.accessToken,
      externalId: parsed.data.externalId,
      isActive: true,
    },
    update: {
      apiKey: parsed.data.apiKey,
      accessToken: parsed.data.accessToken,
      externalId: parsed.data.externalId,
      isActive: true,
      updatedAt: new Date(),
    },
  })

  revalidatePath("/integrations")
  return { success: true }
}

export async function disconnectPlatform(platform: string) {
  const { orgId } = await requireOrg()
  await db.platformConnection.deleteMany({
    where: { organizationId: orgId, platform },
  })
  revalidatePath("/integrations")
  return { success: true }
}

// Simulate a POS sync — in production this would call the platform API
export async function syncPosTransactions(platform: string) {
  const { orgId } = await requireOrg()

  const conn = await db.platformConnection.findFirst({
    where: { organizationId: orgId, platform, isActive: true },
  })
  if (!conn) return { error: "Platform not connected" }

  try {
    // Mock: insert a few sample transactions if none exist yet
    const existing = await db.posTransaction.count({ where: { organizationId: orgId, platform } })
    let recordsPulled = 0

    if (existing === 0) {
      const now = new Date()
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)

      await db.posTransaction.createMany({
        data: [
          {
            organizationId: orgId,
            platform,
            platformTransactionId: `${platform}_demo_1`,
            amount: 42.5,
            tax: 3.82,
            tip: 5.0,
            items: [{ name: "Coffee", qty: 2, price: 21.25 }],
            occurredAt: now,
          },
          {
            organizationId: orgId,
            platform,
            platformTransactionId: `${platform}_demo_2`,
            amount: 125.0,
            tax: 11.25,
            tip: 0,
            items: [{ name: "Lunch special", qty: 5, price: 25.0 }],
            occurredAt: now,
          },
          {
            organizationId: orgId,
            platform,
            platformTransactionId: `${platform}_demo_3`,
            amount: 87.3,
            tax: 7.86,
            tip: 10.0,
            items: [{ name: "Merchandise", qty: 3, price: 29.1 }],
            occurredAt: yesterday,
          },
        ],
        skipDuplicates: true,
      })
      recordsPulled = 3
    }

    await db.posSyncLog.create({
      data: {
        organizationId: orgId,
        platform,
        status: "SUCCESS",
        recordsPulled,
      },
    })

    await db.platformConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    })

    revalidatePath("/integrations")
    revalidatePath("/dashboard")
    return { success: true, recordsPulled }
  } catch (e) {
    await db.posSyncLog.create({
      data: {
        organizationId: orgId,
        platform,
        status: "FAILED",
        error: e instanceof Error ? e.message : "Unknown error",
      },
    })
    return { error: "Sync failed" }
  }
}
