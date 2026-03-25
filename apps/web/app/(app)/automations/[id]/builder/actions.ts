"use server"

import { revalidatePath } from "next/cache"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import type { AutomationGraph } from "@/lib/automation-types"
import { emptyGraph } from "@/lib/automation-types"

export async function saveBuilderAutomation(
  id: string,
  data: {
    name: string
    triggerType: string
    nodes: AutomationGraph
    isActive: boolean
  }
) {
  const { orgId } = await requireOrg()
  await db.automation.updateMany({
    where: { id, organizationId: orgId },
    data: {
      name: data.name,
      triggerType: data.triggerType,
      nodes: JSON.parse(JSON.stringify(data.nodes)),
      isActive: data.isActive,
    },
  })
  revalidatePath(`/automations/${id}/builder`)
  revalidatePath("/automations")
  return { success: true }
}

export async function createBlankAutomation(triggerType?: string) {
  const { orgId, session } = await requireOrg()
  const graph = emptyGraph(triggerType)
  const auto = await db.automation.create({
    data: {
      organizationId: orgId,
      name: "New Automation",
      triggerType: triggerType ?? "manual",
      actions: [],
      nodes: JSON.parse(JSON.stringify(graph)),
      isActive: false,
      createdBy: session.user.id,
    },
  })
  revalidatePath("/automations")
  return { id: auto.id }
}

export async function toggleBuilderEnabled(id: string, isActive: boolean) {
  const { orgId } = await requireOrg()
  await db.automation.updateMany({ where: { id, organizationId: orgId }, data: { isActive } })
  revalidatePath("/automations")
  return { success: true }
}
