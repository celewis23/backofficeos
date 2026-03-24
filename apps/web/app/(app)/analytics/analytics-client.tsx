"use client"

import * as React from "react"
import Link from "next/link"
import {
  TrendingUp, TrendingDown, DollarSign, Users2, Folders,
  FileText, AlertCircle, CheckCircle2, ArrowUpRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency, formatDate } from "@/lib/utils"

interface AnalyticsClientProps {
  revenue: {
    thisMonth: number
    lastMonth: number
    monthly: { month: string; revenue: number }[]
  }
  clients: {
    total: number
    newThisMonth: number
    byStatus: { status: string; count: number }[]
  }
  invoices: {
    byStatus: { status: string; count: number; total: number }[]
    overdue: { id: string; number: string; client: string; amount: number; dueDate: string | null }[]
  }
  projects: {
    byStatus: { status: string; count: number }[]
    recentlyCompleted: { id: string; name: string; completedAt: string }[]
  }
  topClients: { id: string; name: string; revenue: number }[]
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", SENT: "Sent", VIEWED: "Viewed", PARTIAL: "Partial",
  PAID: "Paid", OVERDUE: "Overdue", VOID: "Void", UNCOLLECTIBLE: "Uncollectible",
  BACKLOG: "Backlog", TODO: "To do", IN_PROGRESS: "In progress",
  IN_REVIEW: "In review", COMPLETED: "Completed", ON_HOLD: "On hold", CANCELLED: "Cancelled",
  ACTIVE: "Active", INACTIVE: "Inactive", LEAD: "Lead", CHURNED: "Churned",
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-500", SENT: "bg-blue-500", VIEWED: "bg-indigo-500",
  PARTIAL: "bg-amber-500", OVERDUE: "bg-red-500", DRAFT: "bg-muted-foreground",
  IN_PROGRESS: "bg-blue-500", COMPLETED: "bg-green-500", TODO: "bg-muted-foreground",
  BACKLOG: "bg-muted-foreground", IN_REVIEW: "bg-purple-500",
  ACTIVE: "bg-green-500", INACTIVE: "bg-muted-foreground", LEAD: "bg-blue-500", CHURNED: "bg-red-500",
}

function BarChart({ data }: { data: { month: string; revenue: number }[] }) {
  const max = Math.max(...data.map((d) => d.revenue), 1)
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d) => (
        <div key={d.month} className="flex flex-col items-center gap-1 flex-1">
          <div className="w-full flex items-end" style={{ height: "80px" }}>
            <div
              className="w-full rounded-t bg-primary/80 hover:bg-primary transition-colors"
              style={{ height: `${Math.max((d.revenue / max) * 100, d.revenue > 0 ? 4 : 0)}%` }}
              title={formatCurrency(d.revenue)}
            />
          </div>
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  )
}

function DonutSegments({ segments }: {
  segments: { label: string; count: number; color: string }[]
}) {
  const total = segments.reduce((s, seg) => s + seg.count, 0)
  if (total === 0) return <p className="text-sm text-muted-foreground text-center py-4">No data</p>

  return (
    <div className="space-y-2">
      {segments.map((seg) => (
        <div key={seg.label} className="flex items-center gap-2">
          <div className={`size-2 rounded-full shrink-0 ${seg.color}`} />
          <span className="text-xs text-muted-foreground flex-1">{seg.label}</span>
          <span className="text-xs font-medium">{seg.count}</span>
          <div className="w-20">
            <Progress value={(seg.count / total) * 100} className="h-1" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsClient({
  revenue, clients, invoices, projects, topClients,
}: AnalyticsClientProps) {
  const revenueChange = revenue.lastMonth > 0
    ? ((revenue.thisMonth - revenue.lastMonth) / revenue.lastMonth) * 100
    : 0
  const revenueUp = revenueChange >= 0

  const outstanding = invoices.byStatus
    .filter((s) => ["SENT", "VIEWED", "PARTIAL", "OVERDUE"].includes(s.status))
    .reduce((sum, s) => sum + s.total, 0)

  const paidThisMonth = invoices.byStatus
    .find((s) => s.status === "PAID")?.total ?? 0

  const activeProjects = projects.byStatus
    .filter((s) => s.status === "ACTIVE")
    .reduce((sum, s) => sum + s.count, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">Business overview and performance metrics</p>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Revenue (MTD)</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(revenue.thisMonth)}</p>
                  </div>
                  <div className="size-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <DollarSign className="size-4 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5">
                  {revenueUp
                    ? <TrendingUp className="size-3.5 text-green-500" />
                    : <TrendingDown className="size-3.5 text-destructive" />
                  }
                  <span className={`text-xs font-medium ${revenueUp ? "text-green-500" : "text-destructive"}`}>
                    {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Outstanding</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(outstanding)}</p>
                  </div>
                  <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                    <FileText className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">
                    {invoices.overdue.length} overdue invoices
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active clients</p>
                    <p className="text-2xl font-bold mt-1">{clients.total}</p>
                  </div>
                  <div className="size-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users2 className="size-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">
                    +{clients.newThisMonth} new this month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Active projects</p>
                    <p className="text-2xl font-bold mt-1">{activeProjects}</p>
                  </div>
                  <div className="size-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Folders className="size-4 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-xs text-muted-foreground">
                    {projects.recentlyCompleted.length} completed recently
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue chart + Top clients */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Revenue (last 6 months)</CardTitle>
                <CardDescription>Paid invoices by month</CardDescription>
              </CardHeader>
              <CardContent>
                {revenue.monthly.every((m) => m.revenue === 0) ? (
                  <div className="flex items-center justify-center h-28 text-sm text-muted-foreground">
                    No paid invoices yet
                  </div>
                ) : (
                  <BarChart data={revenue.monthly} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Top clients</CardTitle>
                <CardDescription>By total paid revenue</CardDescription>
              </CardHeader>
              <CardContent>
                {topClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No paid invoices yet</p>
                ) : (
                  <div className="space-y-3">
                    {topClients.map((client, i) => (
                      <div key={client.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground w-4 text-center">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/clients/${client.id}`}
                            className="text-sm font-medium hover:underline truncate block"
                          >
                            {client.name}
                          </Link>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          {formatCurrency(client.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoice breakdown + Project status + Overdue */}
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Invoice breakdown</CardTitle>
                <CardDescription>By status</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutSegments
                  segments={invoices.byStatus.map((s) => ({
                    label: STATUS_LABELS[s.status] ?? s.status,
                    count: s.count,
                    color: STATUS_COLORS[s.status] ?? "bg-muted-foreground",
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Project status</CardTitle>
                <CardDescription>By stage</CardDescription>
              </CardHeader>
              <CardContent>
                <DonutSegments
                  segments={projects.byStatus.map((s) => ({
                    label: STATUS_LABELS[s.status] ?? s.status,
                    count: s.count,
                    color: STATUS_COLORS[s.status] ?? "bg-muted-foreground",
                  }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Overdue invoices</CardTitle>
                  <CardDescription>Needs attention</CardDescription>
                </div>
                <Link href="/billing">
                  <Badge variant="destructive" className="text-[10px]">
                    {invoices.overdue.length}
                  </Badge>
                </Link>
              </CardHeader>
              <CardContent>
                {invoices.overdue.length === 0 ? (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="size-4" />
                    All invoices current
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoices.overdue.map((inv) => (
                      <Link key={inv.id} href={`/billing/invoices/${inv.id}`}>
                        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.client}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.number} · {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <span className="text-sm font-semibold text-destructive">
                              {formatCurrency(inv.amount)}
                            </span>
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

          {/* Client status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Client breakdown</CardTitle>
              <CardDescription>Total {clients.total} clients by status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 flex-wrap">
                {clients.byStatus.map((s) => (
                  <div key={s.status} className="flex items-center gap-2">
                    <div className={`size-2 rounded-full ${STATUS_COLORS[s.status] ?? "bg-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground">{STATUS_LABELS[s.status] ?? s.status}</span>
                    <span className="text-sm font-semibold">{s.count}</span>
                  </div>
                ))}
                {clients.byStatus.length === 0 && (
                  <p className="text-sm text-muted-foreground">No clients yet</p>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
