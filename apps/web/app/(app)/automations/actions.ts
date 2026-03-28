"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { runAutomations as engineRunAutomations } from "@/lib/automation-engine"

const automationSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.string().min(1),
  triggerConfig: z.any().optional(),
  actions: z.array(z.object({ type: z.string(), config: z.record(z.any()) })).min(1),
})

export async function createAutomation(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = automationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const automation = await db.automation.create({
    data: {
      organizationId: orgId,
      name: parsed.data.name,
      description: parsed.data.description,
      triggerType: parsed.data.triggerType,
      triggerConfig: parsed.data.triggerConfig ?? {},
      actions: parsed.data.actions,
    },
  })

  revalidatePath("/automations")
  return { success: true, id: automation.id }
}

export async function updateAutomation(id: string, data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = automationSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  await db.automation.updateMany({
    where: { id, organizationId: orgId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      triggerType: parsed.data.triggerType,
      triggerConfig: parsed.data.triggerConfig ?? {},
      actions: parsed.data.actions,
    },
  })

  revalidatePath("/automations")
  return { success: true }
}

export async function toggleAutomation(id: string, isActive: boolean) {
  const { orgId } = await requireOrg()
  await db.automation.updateMany({
    where: { id, organizationId: orgId },
    data: { isActive },
  })
  revalidatePath("/automations")
  return { success: true }
}

export async function deleteAutomation(id: string) {
  const { orgId } = await requireOrg()
  await db.automation.deleteMany({ where: { id, organizationId: orgId } })
  revalidatePath("/automations")
  return { success: true }
}

// Called from other server actions to fire automation rules — delegates to the engine
export async function runAutomations(
  orgId: string,
  triggerType: string,
  entityType: string,
  entityId: string,
  _triggerData?: Record<string, unknown>   // kept for back-compat; engine uses DB context
) {
  await engineRunAutomations(orgId, triggerType, entityType, entityId)
}
