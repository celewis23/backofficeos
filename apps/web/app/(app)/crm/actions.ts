"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { LeadStatus } from "@backoffice-os/database"
import { createAuditLog } from "@/lib/audit"
import { runAutomations } from "@/app/(app)/automations/actions"

const createLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  value: z.number().optional(),
  notes: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
})

export async function createLead(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createLeadSchema.parse(input)

    await db.lead.create({
      data: {
        organizationId: orgId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source || null,
        value: data.value ?? null,
        notes: data.notes || null,
        status: data.status,
      },
    })

    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create lead" }
  }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  try {
    const { orgId, session } = await requireOrg()

    const lead = await db.lead.findFirst({ where: { id: leadId, organizationId: orgId }, select: { name: true, status: true } })

    await db.lead.update({
      where: { id: leadId, organizationId: orgId },
      data: {
        status,
        closedAt: status === "WON" || status === "LOST" ? new Date() : null,
      },
    })

    await createAuditLog({
      organizationId: orgId,
      userId: session.user.id,
      action: "lead.status_changed",
      entityType: "lead",
      entityId: leadId,
      metadata: { name: lead?.name, from: lead?.status, to: status },
    })

    // Fire automations
    await runAutomations(orgId, "lead_stage_changed", "lead", leadId)
    if (status === "WON") await runAutomations(orgId, "lead_won", "lead", leadId)
    if (status === "LOST") await runAutomations(orgId, "lead_lost", "lead", leadId)

    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update lead" }
  }
}

export async function deleteLead(leadId: string) {
  try {
    const { orgId } = await requireOrg()

    await db.lead.delete({
      where: { id: leadId, organizationId: orgId },
    })

    revalidatePath("/crm")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete lead" }
  }
}
