"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const expenseSchema = z.object({
  vendorName: z.string().min(1),
  vendorId: z.string().optional(),
  category: z.enum(["SOFTWARE", "CONTRACTOR", "EQUIPMENT", "RENT", "UTILITIES", "TRAVEL", "MARKETING", "MEALS", "OTHER"]),
  amount: z.coerce.number().positive(),
  currency: z.string().default("USD"),
  date: z.string(),
  paymentMethod: z.enum(["STRIPE", "PAYPAL", "SQUARE", "BANK_TRANSFER", "CASH", "CHECK", "OTHER"]).default("OTHER"),
  status: z.enum(["PENDING", "PAID", "VOIDED"]).default("PENDING"),
  receiptUrl: z.string().optional(),
  notes: z.string().optional(),
  projectId: z.string().optional(),
})

const vendorSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().or(z.literal("")).optional(),
  phone: z.string().optional(),
  website: z.string().url().or(z.literal("")).optional(),
  paymentTerms: z.coerce.number().optional(),
  notes: z.string().optional(),
})

export async function createExpense(input: unknown) {
  try {
    const { orgId, session } = await requireOrg()
    const data = expenseSchema.parse(input)

    const expense = await db.expense.create({
      data: {
        organizationId: orgId,
        vendorName: data.vendorName,
        vendorId: data.vendorId || null,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        date: new Date(data.date),
        paymentMethod: data.paymentMethod,
        status: data.status,
        receiptUrl: data.receiptUrl || null,
        notes: data.notes || null,
        projectId: data.projectId || null,
        createdBy: session.user.id,
      },
    })

    revalidatePath("/expenses")
    return { success: true, expenseId: expense.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create expense"
    return { error: message }
  }
}

export async function updateExpense(expenseId: string, input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = expenseSchema.partial().parse(input)

    await db.expense.update({
      where: { id: expenseId, organizationId: orgId },
      data: {
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        vendorId: data.vendorId || null,
        projectId: data.projectId || null,
      },
    })

    revalidatePath("/expenses")
    return { success: true }
  } catch (err) {
    return { error: "Failed to update expense" }
  }
}

export async function deleteExpense(expenseId: string) {
  try {
    const { orgId } = await requireOrg()
    await db.expense.delete({ where: { id: expenseId, organizationId: orgId } })
    revalidatePath("/expenses")
    return { success: true }
  } catch (err) {
    return { error: "Failed to delete expense" }
  }
}

export async function createVendor(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = vendorSchema.parse(input)

    const vendor = await db.vendor.create({
      data: {
        organizationId: orgId,
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        website: data.website || null,
        paymentTerms: data.paymentTerms || null,
        notes: data.notes || null,
      },
    })

    revalidatePath("/expenses")
    return { success: true, vendorId: vendor.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create vendor"
    return { error: message }
  }
}

export async function deleteVendor(vendorId: string) {
  try {
    const { orgId } = await requireOrg()
    await db.vendor.delete({ where: { id: vendorId, organizationId: orgId } })
    revalidatePath("/expenses")
    return { success: true }
  } catch (err) {
    return { error: "Failed to delete vendor" }
  }
}
