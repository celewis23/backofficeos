"use server"

import { revalidatePath } from "next/cache"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

// Simulate syncing payroll runs from a connected platform
export async function syncPayrollRuns(platform: string) {
  const { orgId, session } = await requireOrg()

  const conn = await db.platformConnection.findFirst({
    where: { organizationId: orgId, platform, isActive: true },
  })
  if (!conn) return { error: "Payroll platform not connected" }

  const existing = await db.payrollRun.count({ where: { organizationId: orgId, platform } })
  if (existing > 0) return { success: true, message: "Already synced" }

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const run = await db.payrollRun.create({
    data: {
      organizationId: orgId,
      platform,
      platformRunId: `${platform}_demo_run_1`,
      payPeriodStart: periodStart,
      payPeriodEnd: periodEnd,
      runDate: now,
      totalGross: 25000,
      totalNet: 19500,
      totalTaxes: 4500,
      totalDeductions: 1000,
      employeeCount: 5,
      status: "PAID",
    },
  })

  await db.payrollEmployeeSummary.createMany({
    data: [
      { payrollRunId: run.id, organizationId: orgId, employeeName: "Alice Johnson", grossPay: 8000, netPay: 6200, taxes: 1500, deductions: 300, hoursPaid: 80 },
      { payrollRunId: run.id, organizationId: orgId, employeeName: "Bob Smith", grossPay: 6500, netPay: 5100, taxes: 1100, deductions: 300, hoursPaid: 80 },
      { payrollRunId: run.id, organizationId: orgId, employeeName: "Carol White", grossPay: 5500, netPay: 4300, taxes: 900, deductions: 300, hoursPaid: 80 },
      { payrollRunId: run.id, organizationId: orgId, employeeName: "David Lee", grossPay: 3000, netPay: 2400, taxes: 500, deductions: 100, hoursPaid: 40, isContractor: true },
      { payrollRunId: run.id, organizationId: orgId, employeeName: "Eva Brown", grossPay: 2000, netPay: 1500, taxes: 400, deductions: 100, hoursPaid: 30, isContractor: true },
    ],
  })

  // Auto-create an Expense entry for this payroll run
  const expense = await db.expense.create({
    data: {
      organizationId: orgId,
      category: "PAYROLL",
      vendorName: platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      amount: 25000,
      currency: "USD",
      date: now,
      status: "APPROVED",
      notes: `Payroll run ${periodStart.toLocaleDateString()} – ${periodEnd.toLocaleDateString()}`,
      createdBy: session.user.id,
    },
  })

  await db.payrollRun.update({
    where: { id: run.id },
    data: { expenseId: expense.id },
  })

  await db.platformConnection.update({
    where: { id: conn.id },
    data: { lastSyncAt: new Date() },
  })

  revalidatePath("/hr")
  return { success: true, runId: run.id }
}

export async function connectPayrollPlatform(platform: string, apiKey: string) {
  const { orgId } = await requireOrg()

  if (!apiKey.trim()) return { error: "API key is required" }

  await db.platformConnection.upsert({
    where: { organizationId_platform: { organizationId: orgId, platform } },
    create: {
      organizationId: orgId,
      platform,
      category: "payroll",
      apiKey,
      isActive: true,
    },
    update: {
      apiKey,
      isActive: true,
      updatedAt: new Date(),
    },
  })

  revalidatePath("/hr")
  return { success: true }
}

export async function disconnectPayrollPlatform(platform: string) {
  const { orgId } = await requireOrg()
  await db.platformConnection.deleteMany({
    where: { organizationId: orgId, platform },
  })
  revalidatePath("/hr")
  return { success: true }
}

// Push time entries for a user to payroll platform (marks them as synced)
export async function syncHoursToPayroll(userId: string, platform: string) {
  const { orgId } = await requireOrg()

  const conn = await db.platformConnection.findFirst({
    where: { organizationId: orgId, platform, isActive: true },
  })
  if (!conn) return { error: "Platform not connected" }

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const entries = await db.timeEntry.findMany({
    where: {
      organizationId: orgId,
      userId,
      payrollSynced: false,
      startTime: { gte: periodStart },
    },
  })

  if (entries.length === 0) return { success: true, message: "No unsynced hours" }

  await db.timeEntry.updateMany({
    where: { id: { in: entries.map((e) => e.id) } },
    data: { payrollSynced: true },
  })

  revalidatePath("/hr")
  return { success: true, synced: entries.length }
}
