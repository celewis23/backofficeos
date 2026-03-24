"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import type { LeadStatus } from "@backoffice-os/database"

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
    const { orgId } = await requireOrg()

    await db.lead.update({
      where: { id: leadId, organizationId: orgId },
      data: {
        status,
        closedAt: status === "WON" || status === "LOST" ? new Date() : null,
      },
    })

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
