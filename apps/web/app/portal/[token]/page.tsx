import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { formatCurrency, formatDate } from "@/lib/utils"
import { DollarSign, Folders, Calendar, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function PortalOverviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const clientId = portalToken.clientId
  const orgId = portalToken.client.organizationId

  const [invoiceSummary, activeProjects, upcomingEvents, recentInvoices] = await Promise.all([
    db.invoice.aggregate({
      where: { clientId, organizationId: orgId, status: { in: ["SENT", "VIEWED", "PARTIAL", "OVERDUE"] } },
      _sum: { amountDue: true },
      _count: { id: true },
    }),
    db.project.count({ where: { clientId, organizationId: orgId, status: "ACTIVE" } }),
    db.event.findMany({
      where: { clientId, organizationId: orgId, startAt: { gte: new Date() } },
      orderBy: { startAt: "asc" },
      take: 3,
      select: { id: true, title: true, startAt: true, endAt: true },
    }),
    db.invoice.findMany({
      where: { clientId, organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, number: true, status: true, total: true, dueDate: true },
    }),
  ])

  const outstandingBalance = Number(invoiceSummary._sum.amountDue ?? 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your account summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="size-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Outstanding balance</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(outstandingBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">{invoiceSummary._count.id} unpaid invoice{invoiceSummary._count.id !== 1 ? "s" : ""}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Folders className="size-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Active projects</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{activeProjects}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Upcoming appointments</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{upcomingEvents.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent invoices */}
      {recentInvoices.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Recent invoices</CardTitle>
              <Link href={`/portal/${token}/invoices`} className="text-xs text-primary hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <FileText className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{inv.number}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${inv.status === "PAID" ? "text-green-600" : inv.status === "OVERDUE" ? "text-red-600" : ""}`}
                    >
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {inv.dueDate && <span className="text-xs text-muted-foreground">Due {formatDate(inv.dueDate)}</span>}
                    <span className="font-semibold">{formatCurrency(Number(inv.total))}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Upcoming appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-muted-foreground" />
                    <span className="text-sm font-medium">{event.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(event.startAt)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
