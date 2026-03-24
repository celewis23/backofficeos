"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

// ============================================================
// Custom Fields
// ============================================================

const customFieldSchema = z.object({
  entityType: z.enum(["client", "lead", "project", "invoice"]),
  label: z.string().min(1),
  key: z.string().min(1).regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores"),
  fieldType: z.enum(["text", "number", "date", "select", "boolean", "url"]),
  options: z.array(z.string()).optional(),
  required: z.boolean().default(false),
  sortOrder: z.number().default(0),
})

export async function createCustomField(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = customFieldSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await db.customField.findFirst({
    where: { organizationId: orgId, entityType: parsed.data.entityType, key: parsed.data.key },
  })
  if (existing) return { error: "A field with this key already exists for this entity type" }

  await db.customField.create({
    data: { organizationId: orgId, ...parsed.data, options: parsed.data.options ?? [] },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function deleteCustomField(id: string) {
  const { orgId } = await requireOrg()
  await db.customField.deleteMany({ where: { id, organizationId: orgId } })
  revalidatePath("/settings")
  return { success: true }
}

// ============================================================
// Tax Rates
// ============================================================

const taxRateSchema = z.object({
  name: z.string().min(1),
  rate: z.coerce.number().min(0).max(100),
  country: z.string().optional(),
  region: z.string().optional(),
  isDefault: z.boolean().default(false),
})

export async function createTaxRate(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = taxRateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (parsed.data.isDefault) {
    await db.taxRate.updateMany({
      where: { organizationId: orgId },
      data: { isDefault: false },
    })
  }

  await db.taxRate.create({
    data: { organizationId: orgId, ...parsed.data, rate: parsed.data.rate / 100 },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function updateTaxRate(id: string, data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = taxRateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  if (parsed.data.isDefault) {
    await db.taxRate.updateMany({
      where: { organizationId: orgId, NOT: { id } },
      data: { isDefault: false },
    })
  }

  await db.taxRate.updateMany({
    where: { id, organizationId: orgId },
    data: { ...parsed.data, rate: parsed.data.rate / 100 },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function deleteTaxRate(id: string) {
  const { orgId } = await requireOrg()
  await db.taxRate.deleteMany({ where: { id, organizationId: orgId } })
  revalidatePath("/settings")
  return { success: true }
}

// ============================================================
// Data Export
// ============================================================

export async function requestDataExport(scope: string[], format: "csv" | "json") {
  const { orgId, session } = await requireOrg()
  const userId = session.user.id

  const job = await db.dataExportJob.create({
    data: {
      organizationId: orgId,
      requestedBy: userId,
      scope,
      format,
      status: "PROCESSING",
    },
  })

  // Generate export synchronously (for small orgs this is fine)
  try {
    const data: Record<string, unknown[]> = {}

    if (scope.includes("clients")) {
      data.clients = await db.client.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, email: true, phone: true, website: true, industry: true, status: true, createdAt: true },
      })
    }
    if (scope.includes("invoices")) {
      data.invoices = await db.invoice.findMany({
        where: { organizationId: orgId },
        select: { id: true, number: true, status: true, total: true, currency: true, issueDate: true, dueDate: true, paidAt: true },
      })
    }
    if (scope.includes("expenses")) {
      data.expenses = await db.expense.findMany({
        where: { organizationId: orgId },
        select: { id: true, vendorName: true, category: true, amount: true, currency: true, date: true, status: true },
      })
    }
    if (scope.includes("projects")) {
      data.projects = await db.project.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, status: true, budget: true, startDate: true, dueDate: true },
      })
    }
    if (scope.includes("leads")) {
      data.leads = await db.lead.findMany({
        where: { organizationId: orgId },
        select: { id: true, name: true, email: true, company: true, status: true, value: true, createdAt: true },
      })
    }

    // Mark as done (in production, upload to storage and set fileUrl)
    await db.dataExportJob.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return { success: true, data, jobId: job.id }
  } catch (e) {
    await db.dataExportJob.update({
      where: { id: job.id },
      data: { status: "FAILED" },
    })
    throw e
  }
}

// ============================================================
// GDPR Requests
// ============================================================

export async function submitGdprRequest(type: string, clientId?: string, notes?: string) {
  const { orgId, session } = await requireOrg()
  const userId = session.user.id

  await db.gdprRequest.create({
    data: {
      organizationId: orgId,
      requestedBy: userId,
      clientId: clientId || null,
      type: type as "DATA_ACCESS" | "DATA_DELETION" | "DATA_PORTABILITY" | "RECTIFICATION",
      notes: notes || null,
    },
  })

  revalidatePath("/settings")
  return { success: true }
}

export async function resolveGdprRequest(id: string, status: "COMPLETED" | "REJECTED") {
  const { orgId } = await requireOrg()
  await db.gdprRequest.updateMany({
    where: { id, organizationId: orgId },
    data: { status, resolvedAt: new Date() },
  })
  revalidatePath("/settings")
  return { success: true }
}

export async function deleteClientData(clientId: string) {
  const { orgId, session } = await requireOrg()

  // Verify client belongs to this org
  const client = await db.client.findUnique({
    where: { id: clientId, organizationId: orgId },
    select: { id: true, name: true },
  })
  if (!client) return { error: "Client not found" }

  // Anonymize PII fields
  await db.client.update({
    where: { id: clientId },
    data: {
      name: "[Deleted]",
      email: null,
      phone: null,
      website: null,
      address: null,
      notes: null,
      avatar: null,
      status: "ARCHIVED",
    },
  })

  // Remove contacts
  await db.contact.deleteMany({ where: { clientId } })

  // Log the erasure action
  await db.auditLog.create({
    data: {
      organizationId: orgId,
      userId: session.user.id,
      action: "gdpr.client_data_deleted",
      entityType: "client",
      entityId: clientId,
      metadata: { originalName: client.name },
    },
  })

  // Log a GDPR request for the erasure
  await db.gdprRequest.create({
    data: {
      organizationId: orgId,
      requestedBy: session.user.id,
      clientId,
      type: "DATA_DELETION",
      notes: "Data deleted via GDPR erasure action",
      status: "COMPLETED",
      resolvedAt: new Date(),
    },
  })

  revalidatePath("/settings")
  revalidatePath("/clients")
  return { success: true }
}
