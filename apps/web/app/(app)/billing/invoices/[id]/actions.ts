"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createNotification } from "@/lib/notifications"
import { createAuditLog } from "@/lib/audit"
import { runAutomations } from "@/app/(app)/automations/actions"

export async function updateInvoiceStatus(
  invoiceId: string,
  status: "SENT" | "PAID" | "VOID" | "OVERDUE"
) {
  try {
    const { orgId, session } = await requireOrg()

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
    })
    if (!invoice) return { error: "Invoice not found" }

    const data: Record<string, unknown> = { status }
    if (status === "PAID") {
      data.paidAt = new Date()
      data.amountPaid = invoice.total
      data.amountDue = 0
    }

    await db.invoice.update({
      where: { id: invoiceId },
      data,
    })

    // Notifications
    if (status === "PAID") {
      await createNotification({
        organizationId: orgId,
        type: "INVOICE_PAID",
        title: "Invoice paid",
        body: `Invoice ${invoice.number} has been marked as paid.`,
        entityType: "invoice",
        entityId: invoiceId,
      })
    } else if (status === "OVERDUE") {
      await createNotification({
        organizationId: orgId,
        type: "INVOICE_OVERDUE",
        title: "Invoice overdue",
        body: `Invoice ${invoice.number} is overdue.`,
        entityType: "invoice",
        entityId: invoiceId,
      })
    }

    // Audit log
    await createAuditLog({
      organizationId: orgId,
      userId: session.user.id,
      action: `invoice.status_changed.${status.toLowerCase()}`,
      entityType: "invoice",
      entityId: invoiceId,
      metadata: { from: invoice.status, to: status },
    })

    // Fire automations
    const triggerMap: Record<string, string> = { PAID: "invoice.paid", OVERDUE: "invoice.overdue" }
    if (triggerMap[status]) {
      await runAutomations(orgId, triggerMap[status], "invoice", invoiceId, { status, number: invoice.number })
    }

    revalidatePath(`/billing/invoices/${invoiceId}`)
    revalidatePath("/billing")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update status" }
  }
}

const recordPaymentSchema = z.object({
  invoiceId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["STRIPE", "PAYPAL", "SQUARE", "BANK_TRANSFER", "CASH", "CHECK", "OTHER"]),
  reference: z.string().optional(),
  paidAt: z.string(),
})

export async function recordPayment(input: unknown) {
  try {
    const { orgId, session } = await requireOrg()
    const data = recordPaymentSchema.parse(input)

    const invoice = await db.invoice.findFirst({
      where: { id: data.invoiceId, organizationId: orgId },
    })
    if (!invoice) return { error: "Invoice not found" }

    const newPaid = Number(invoice.amountPaid) + data.amount
    const newDue = Math.max(0, Number(invoice.total) - newPaid)

    await db.$transaction([
      db.payment.create({
        data: {
          organizationId: orgId,
          invoiceId: data.invoiceId,
          clientId: invoice.clientId,
          amount: data.amount,
          method: data.method,
          status: "SUCCEEDED",
          reference: data.reference || null,
          paidAt: new Date(data.paidAt),
        },
      }),
      db.invoice.update({
        where: { id: data.invoiceId },
        data: {
          amountPaid: newPaid,
          amountDue: newDue,
          status: newDue === 0 ? "PAID" : "PARTIAL",
          paidAt: newDue === 0 ? new Date(data.paidAt) : null,
        },
      }),
    ])

    await createAuditLog({
      organizationId: orgId,
      userId: session.user.id,
      action: "invoice.payment_recorded",
      entityType: "invoice",
      entityId: data.invoiceId,
      metadata: { amount: data.amount, method: data.method },
    })

    revalidatePath(`/billing/invoices/${data.invoiceId}`)
    revalidatePath("/billing")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to record payment" }
  }
}

export async function duplicateInvoice(invoiceId: string) {
  try {
    const { orgId } = await requireOrg()

    const invoice = await db.invoice.findFirst({
      where: { id: invoiceId, organizationId: orgId },
      include: { items: true },
    })
    if (!invoice) return { error: "Invoice not found" }

    // Generate next invoice number
    const last = await db.invoice.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    })
    const lastNum = last?.number.match(/(\d+)$/)?.[1]
    const nextNum = lastNum ? String(parseInt(lastNum, 10) + 1).padStart(4, "0") : "0001"
    const number = `INV-${nextNum}`

    const copy = await db.invoice.create({
      data: {
        organizationId: orgId,
        clientId: invoice.clientId,
        number,
        status: "DRAFT",
        issueDate: new Date(),
        dueDate: invoice.dueDate,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        discount: invoice.discount,
        total: invoice.total,
        amountDue: invoice.total,
        notes: invoice.notes,
        terms: invoice.terms,
        items: {
          create: invoice.items.map((item, idx) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.amount,
            taxable: item.taxable,
            order: idx,
          })),
        },
      },
    })

    revalidatePath("/billing")
    return { success: true, invoiceId: copy.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to duplicate invoice" }
  }
}
