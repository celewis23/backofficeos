import type { Metadata } from "next"
import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { AnalyticsClient } from "./analytics-client"

export const metadata: Metadata = { title: "Analytics" }

export default async function AnalyticsPage() {
  const { orgId } = await requireOrg()

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  // Expense stats
  const [expensesThisMonth, expensesLastMonth] = await Promise.all([
    db.expense.aggregate({
      where: { organizationId: orgId, date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.expense.aggregate({
      where: { organizationId: orgId, date: { gte: lastMonthStart, lt: thisMonthStart } },
      _sum: { amount: true },
    }),
  ])

  // Revenue stats
  const [revenueThisMonth, revenueLastMonth, revenueByMonth] = await Promise.all([
    db.invoice.aggregate({
      where: { organizationId: orgId, status: "PAID", paidAt: { gte: thisMonthStart } },
      _sum: { total: true },
    }),
    db.invoice.aggregate({
      where: {
        organizationId: orgId,
        status: "PAID",
        paidAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
      _sum: { total: true },
    }),
    // Last 6 months of paid invoices grouped manually
    db.invoice.findMany({
      where: {
        organizationId: orgId,
        status: "PAID",
        paidAt: { gte: sixMonthsAgo },
      },
      select: { paidAt: true, total: true },
    }),
  ])

  // Client stats
  const [totalClients, newClientsThisMonth, clientsByStatus] = await Promise.all([
    db.client.count({ where: { organizationId: orgId } }),
    db.client.count({
      where: { organizationId: orgId, createdAt: { gte: thisMonthStart } },
    }),
    db.client.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
    }),
  ])

  // Invoice stats
  const [invoiceStats, overdueInvoices] = await Promise.all([
    db.invoice.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _count: { id: true },
      _sum: { total: true },
    }),
    db.invoice.findMany({
      where: { organizationId: orgId, status: "OVERDUE" },
      select: { id: true, number: true, total: true, dueDate: true, client: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ])

  // Project stats
  const [projectStats, recentlyCompleted] = await Promise.all([
    db.project.groupBy({
      by: ["status"],
      where: { organizationId: orgId, isTemplate: false },
      _count: { id: true },
    }),
    db.project.findMany({
      where: { organizationId: orgId, status: "COMPLETED", isTemplate: false },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ])

  // Top clients by revenue
  const topClients = await db.invoice.groupBy({
    by: ["clientId"],
    where: { organizationId: orgId, status: "PAID", clientId: { not: null } },
    _sum: { total: true },
    orderBy: { _sum: { total: "desc" } },
    take: 5,
  })

  const topClientDetails = await Promise.all(
    topClients.map(async (tc: (typeof topClients)[number]) => {
      const client = await db.client.findUnique({
        where: { id: tc.clientId! },
        select: { id: true, name: true },
      })
      return { client, revenue: Number(tc._sum.total ?? 0) }
    })
  )

  // Build monthly revenue series
  const monthlyRevenue: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const label = start.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    const revenue = revenueByMonth
      .filter((inv: (typeof revenueByMonth)[number]) => inv.paidAt && inv.paidAt >= start && inv.paidAt < end)
      .reduce((sum: number, inv: (typeof revenueByMonth)[number]) => sum + Number(inv.total), 0)
    monthlyRevenue.push({ month: label, revenue })
  }

  return (
    <AnalyticsClient
      revenue={{
        thisMonth: Number(revenueThisMonth._sum.total ?? 0),
        lastMonth: Number(revenueLastMonth._sum.total ?? 0),
        monthly: monthlyRevenue,
      }}
      clients={{
        total: totalClients,
        newThisMonth: newClientsThisMonth,
        byStatus: clientsByStatus.map((s: (typeof clientsByStatus)[number]) => ({ status: s.status, count: s._count.id })),
      }}
      invoices={{
        byStatus: invoiceStats.map((s: (typeof invoiceStats)[number]) => ({
          status: s.status,
          count: s._count.id,
          total: Number(s._sum.total ?? 0),
        })),
        overdue: overdueInvoices.map((inv: (typeof overdueInvoices)[number]) => ({
          id: inv.id,
          number: inv.number,
          client: inv.client?.name ?? "—",
          amount: Number(inv.total),
          dueDate: inv.dueDate?.toISOString() ?? null,
        })),
      }}
      projects={{
        byStatus: projectStats.map((s: (typeof projectStats)[number]) => ({ status: s.status, count: s._count.id })),
        recentlyCompleted: recentlyCompleted.map((p: (typeof recentlyCompleted)[number]) => ({
          id: p.id,
          name: p.name,
          completedAt: p.updatedAt.toISOString(),
        })),
      }}
      topClients={topClientDetails
        .filter((tc: (typeof topClientDetails)[number]) => tc.client)
        .map((tc: (typeof topClientDetails)[number]) => ({ id: tc.client!.id, name: tc.client!.name, revenue: tc.revenue }))}
      expenses={{
        thisMonth: Number(expensesThisMonth._sum.amount ?? 0),
        lastMonth: Number(expensesLastMonth._sum.amount ?? 0),
      }}
    />
  )
}
