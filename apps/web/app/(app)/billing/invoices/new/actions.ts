"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createInvoiceSchema = z.object({
  number: z.string(),
  clientId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  currency: z.string().default("USD"),
  taxRate: z.number().default(0),
  discount: z.number().default(0),
  subtotal: z.number(),
  taxAmount: z.number(),
  total: z.number(),
  amountDue: z.number(),
  status: z.enum(["DRAFT", "SENT"]).default("DRAFT"),
  notes: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    amount: z.number().optional(),
    taxable: z.boolean().default(true),
  })),
})

export async function createInvoice(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createInvoiceSchema.parse(input)

    // Ensure unique number
    const existing = await db.invoice.findUnique({
      where: { organizationId_number: { organizationId: orgId, number: data.number } },
    })
    if (existing) {
      return { error: `Invoice number ${data.number} already exists` }
    }

    const invoice = await db.invoice.create({
      data: {
        organizationId: orgId,
        clientId: data.clientId || null,
        number: data.number,
        status: data.status,
        issueDate: new Date(data.issueDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        currency: data.currency,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        discount: data.discount,
        total: data.total,
        amountDue: data.amountDue,
        notes: data.notes || null,
        terms: data.terms || null,
        items: {
          create: data.items.map((item, index) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            taxable: item.taxable,
            order: index,
          })),
        },
      },
    })

    revalidatePath("/billing")
    return { success: true, invoiceId: invoice.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create invoice"
    return { error: message }
  }
}
