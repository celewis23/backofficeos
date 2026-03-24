import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { ExpensesClient } from "./expenses-client"

export const metadata = { title: "Expenses — ArcheionOS" }

export default async function ExpensesPage() {
  const { orgId } = await requireOrg()

  const [expenses, vendors, projects, expenseStats] = await Promise.all([
    db.expense.findMany({
      where: { organizationId: orgId },
      include: {
        vendor: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
      take: 100,
    }),
    db.vendor.findMany({
      where: { organizationId: orgId },
      orderBy: { name: "asc" },
    }),
    db.project.findMany({
      where: { organizationId: orgId, status: { in: ["ACTIVE", "ON_HOLD"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.expense.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  const totalPaid = expenseStats
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + Number(s._sum.amount ?? 0), 0)

  const totalPending = expenseStats
    .filter((s) => s.status === "PENDING")
    .reduce((sum, s) => sum + Number(s._sum.amount ?? 0), 0)

  const totalCount = expenseStats.reduce((sum, s) => sum + s._count.id, 0)

  return (
    <ExpensesClient
      expenses={expenses}
      vendors={vendors}
      projects={projects}
      stats={{ totalPaid, totalPending, totalCount }}
    />
  )
}
