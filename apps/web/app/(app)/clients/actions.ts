"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { runAutomations } from "@/app/(app)/automations/actions"

const createClientSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  website: z.string().url().or(z.literal("")).optional(),
  industry: z.string().optional(),
  status: z.enum(["ACTIVE", "PROSPECT", "INACTIVE"]).default("ACTIVE"),
})

export async function createClient(input: unknown) {
  try {
    const { orgId, session } = await requireOrg()
    const data = createClientSchema.parse(input)

    const client = await db.client.create({
      data: {
        organizationId: orgId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        industry: data.industry || null,
        status: data.status,
      },
    })

    await createAuditLog({
      organizationId: orgId,
      userId: session.user.id,
      action: "client.created",
      entityType: "client",
      entityId: client.id,
      metadata: { name: data.name },
    })

    await runAutomations(orgId, "client.created", "client", client.id, { name: data.name })

    revalidatePath("/clients")
    return { success: true, clientId: client.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create client"
    return { error: message }
  }
}

export async function updateClientStatus(clientId: string, status: "ACTIVE" | "INACTIVE" | "PROSPECT" | "ARCHIVED") {
  try {
    const { orgId } = await requireOrg()

    await db.client.update({
      where: { id: clientId, organizationId: orgId },
      data: { status },
    })

    revalidatePath("/clients")
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
  } catch (err) {
    return { error: "Failed to update client" }
  }
}

export async function deleteClient(clientId: string) {
  try {
    const { orgId, session } = await requireOrg()

    const client = await db.client.findUnique({ where: { id: clientId, organizationId: orgId }, select: { name: true } })

    await db.client.delete({
      where: { id: clientId, organizationId: orgId },
    })

    await createAuditLog({
      organizationId: orgId,
      userId: session.user.id,
      action: "client.deleted",
      entityType: "client",
      entityId: clientId,
      metadata: { name: client?.name },
    })

    revalidatePath("/clients")
    return { success: true }
  } catch (err) {
    return { error: "Failed to delete client" }
  }
}
