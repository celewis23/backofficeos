import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { BillingClient } from "./billing-client"

export const metadata = { title: "Billing — ArcheionOS" }

export default async function BillingPage() {
  const { orgId } = await requireOrg()

  const [invoices, stats] = await Promise.all([
    db.invoice.findMany({
      where: { organizationId: orgId },
      include: { client: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.invoice.groupBy({
      by: ["status"],
      where: { organizationId: orgId },
      _sum: { total: true, amountDue: true },
      _count: { id: true },
    }),
  ])

  const totalRevenue = stats
    .filter((s) => s.status === "PAID")
    .reduce((sum, s) => sum + Number(s._sum.total ?? 0), 0)

  const outstanding = stats
    .filter((s) => ["SENT", "VIEWED", "PARTIAL", "OVERDUE"].includes(s.status))
    .reduce((sum, s) => sum + Number(s._sum.amountDue ?? 0), 0)

  const overdue = stats
    .filter((s) => s.status === "OVERDUE")
    .reduce((sum, s) => sum + Number(s._sum.amountDue ?? 0), 0)

  const draftCount = stats.find((s) => s.status === "DRAFT")?._count.id ?? 0

  return (
    <BillingClient
      invoices={invoices}
      stats={{ totalRevenue, outstanding, overdue, draftCount }}
    />
  )
}
