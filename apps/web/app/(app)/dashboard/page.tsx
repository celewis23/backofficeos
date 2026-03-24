import type { Metadata } from "next"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, DollarSign, Users2,
  Folders, Clock, ArrowUpRight, CheckCircle2, AlertCircle,
  Calendar, FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate, initials } from "@/lib/utils"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const { session, orgId } = await requireOrg()
  const user = session.user
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    revenueThisMonth,
    revenueLastMonth,
    expensesThisMonth,
    totalClients,
    activeProjects,
    overdueInvoices,
    recentInvoices,
    upcomingEvents,
    recentProjects,
  ] = await Promise.all([
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
    db.expense.aggregate({
      where: { organizationId: orgId, date: { gte: thisMonthStart } },
      _sum: { amount: true },
    }),
    db.client.count({ where: { organizationId: orgId, status: { in: ["ACTIVE", "PROSPECT"] } } }),
    db.project.count({
      where: {
        organizationId: orgId,
        isTemplate: false,
        status: "ACTIVE",
      },
    }),
    db.invoice.count({ where: { organizationId: orgId, status: "OVERDUE" } }),
    db.invoice.findMany({
      where: { organizationId: orgId },
      include: { client: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.event.findMany({
      where: {
        organizationId: orgId,
        startAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { client: { select: { name: true } } },
      orderBy: { startAt: "asc" },
      take: 4,
    }),
    db.project.findMany({
      where: {
        organizationId: orgId,
        isTemplate: false,
        status: "ACTIVE",
      },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          where: { status: "DONE" },
          select: { id: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
  ])

  const revenueThis = Number(revenueThisMonth._sum.total ?? 0)
  const revenueLast = Number(revenueLastMonth._sum.total ?? 0)
  const expensesThis = Number(expensesThisMonth._sum.amount ?? 0)
  const netThis = revenueThis - expensesThis
  const revenueChange = revenueLast > 0
    ? ((revenueThis - revenueLast) / revenueLast) * 100
    : 0

  const hour = now.getHours()
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const STATS = [
    {
      label: "Revenue (MTD)",
      value: formatCurrency(revenueThis),
      change: `${revenueChange >= 0 ? "+" : ""}${revenueChange.toFixed(1)}%`,
      trend: revenueChange >= 0 ? "up" : "down",
      icon: DollarSign,
      sub: `vs ${formatCurrency(revenueLast)} last month`,
    },
    {
      label: "Active Clients",
      value: totalClients.toString(),
      icon: Users2,
      trend: "up",
      change: "",
      sub: "active & lead",
    },
    {
      label: "Open Projects",
      value: activeProjects.toString(),
      icon: Folders,
      trend: "up",
      change: "",
      sub: "in progress",
    },
    {
      label: "Overdue Invoices",
      value: overdueInvoices.toString(),
      icon: AlertCircle,
      trend: overdueInvoices > 0 ? "down" : "up",
      change: "",
      sub: "need attention",
    },
  ]

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Greeting */}
        <div>
          <h2 className="text-xl font-semibold">{greeting}, {user.name.split(" ")[0]}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {overdueInvoices > 0
              ? `You have ${overdueInvoices} overdue invoice${overdueInvoices > 1 ? "s" : ""} that need attention.`
              : "Everything looks good. Here's your business at a glance."}
          </p>
        </div>

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                  <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                    <stat.icon className="size-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {stat.trend === "up" ? (
                    <TrendingUp className="size-3.5 text-green-500" />
                  ) : (
                    <TrendingDown className="size-3.5 text-destructive" />
                  )}
                  {stat.change && (
                    <span className={`text-xs font-medium ${stat.trend === "up" ? "text-green-500" : "text-destructive"}`}>
                      {stat.change}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{stat.sub}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* P&L summary */}
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="pr-6">
                <p className="text-xs font-medium text-muted-foreground">Revenue (MTD)</p>
                <p className="text-xl font-bold mt-1 text-green-600 dark:text-green-400">{formatCurrency(revenueThis)}</p>
              </div>
              <div className="px-6">
                <p className="text-xs font-medium text-muted-foreground">Expenses (MTD)</p>
                <p className="text-xl font-bold mt-1 text-red-500">{formatCurrency(expensesThis)}</p>
              </div>
              <div className="pl-6">
                <p className="text-xs font-medium text-muted-foreground">Net P&L (MTD)</p>
                <p className={`text-xl font-bold mt-1 ${netThis >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatCurrency(netThis)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* Projects */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
                <CardDescription>{activeProjects} projects in progress</CardDescription>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowUpRight className="size-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentProjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active projects yet.</p>
              ) : (
                recentProjects.map((project) => {
                  const total = project._count.tasks
                  const done = project.tasks.length
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  return (
                    <div key={project.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <Link href={`/projects/${project.id}`}>
                            <p className="text-sm font-medium truncate hover:underline">{project.name}</p>
                          </Link>
                          <p className="text-xs text-muted-foreground capitalize">
                            {project.status.replace("_", " ").toLowerCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-4">
                          {project.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due {formatDate(project.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} className="h-1.5" />
                        <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Upcoming events */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Upcoming</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events scheduled.</p>
              ) : (
                upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Calendar className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.startAt, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Link href="/calendar">
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                  View calendar
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
            <Link href="/billing">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all <ArrowUpRight className="size-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground">No invoices yet.</p>
                <Link href="/billing/invoices/new">
                  <Button size="sm" variant="outline" className="mt-3">Create invoice</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentInvoices.map((inv) => (
                  <Link key={inv.id} href={`/billing/invoices/${inv.id}`}>
                    <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <FileText className="size-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{inv.number}</p>
                          <p className="text-xs text-muted-foreground">{inv.client?.name ?? "No client"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                          inv.status === "PAID" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                          inv.status === "OVERDUE" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                          inv.status === "SENT" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {inv.status.charAt(0) + inv.status.slice(1).toLowerCase()}
                        </span>
                        <span className="text-sm font-semibold">{formatCurrency(Number(inv.total))}</span>
                        <ArrowUpRight className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </main>
  )
}
