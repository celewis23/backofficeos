"use client"

import * as React from "react"
import Link from "next/link"
import {
  Plus, Search, Filter, MoreHorizontal, FileText,
  TrendingUp, Clock, AlertCircle, DollarSign, ChevronRight,
  Send, Eye, Download, Copy, Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate, initials } from "@/lib/utils"
import type { Invoice, Client, InvoiceStatus } from "@backoffice-os/database"

type InvoiceWithClient = Invoice & {
  client: Pick<Client, "id" | "name" | "avatar"> | null
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; class: string }> = {
  DRAFT: { label: "Draft", class: "bg-muted text-muted-foreground" },
  SENT: { label: "Sent", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  VIEWED: { label: "Viewed", class: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  PARTIAL: { label: "Partial", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Paid", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  OVERDUE: { label: "Overdue", class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  VOID: { label: "Void", class: "bg-muted text-muted-foreground" },
  UNCOLLECTIBLE: { label: "Uncollectible", class: "bg-muted text-muted-foreground" },
}

interface BillingClientProps {
  invoices: InvoiceWithClient[]
  stats: {
    totalRevenue: number
    outstanding: number
    overdue: number
    draftCount: number
  }
}

export function BillingClient({ invoices, stats }: BillingClientProps) {
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [tab, setTab] = React.useState("invoices")

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      search === "" ||
      inv.number.toLowerCase().includes(search.toLowerCase()) ||
      inv.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">{invoices.length} invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/billing/estimates/new">
            <Button variant="outline" size="sm">New estimate</Button>
          </Link>
          <Link href="/billing/invoices/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="size-3.5" />
              New invoice
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-px bg-border border-b border-border shrink-0">
        {[
          { label: "Revenue (paid)", value: formatCurrency(stats.totalRevenue), icon: TrendingUp, color: "text-green-500" },
          { label: "Outstanding", value: formatCurrency(stats.outstanding), icon: Clock, color: "text-amber-500" },
          { label: "Overdue", value: formatCurrency(stats.overdue), icon: AlertCircle, color: "text-destructive" },
          { label: "Drafts", value: stats.draftCount.toString(), icon: FileText, color: "text-muted-foreground" },
        ].map((stat) => (
          <div key={stat.label} className="bg-background px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`size-3.5 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-semibold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="invoices" className="text-xs px-3">Invoices</TabsTrigger>
            <TabsTrigger value="estimates" className="text-xs px-3">Estimates</TabsTrigger>
            <TabsTrigger value="recurring" className="text-xs px-3">Recurring</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2 ml-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search invoices..."
              className="pl-9 h-8 w-56 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-32 text-sm">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoice list */}
      <div className="flex-1 overflow-auto">
        {tab === "invoices" && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30 sticky top-0">
              <span>Invoice</span>
              <span>Client</span>
              <span>Date</span>
              <span>Due</span>
              <span className="text-right">Amount</span>
              <span />
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <FileText className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No invoices found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search || statusFilter !== "all" ? "Try adjusting your filters" : "Create your first invoice to get started"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((invoice) => (
                  <InvoiceRow key={invoice.id} invoice={invoice} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "estimates" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <FileText className="size-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No estimates</p>
            <Link href="/billing/estimates/new">
              <Button size="sm" variant="outline" className="mt-3">Create estimate</Button>
            </Link>
          </div>
        )}

        {tab === "recurring" && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Clock className="size-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">No recurring billing</p>
            <p className="text-xs text-muted-foreground mt-1">Set up automatic recurring invoices for retainer clients</p>
          </div>
        )}
      </div>
    </div>
  )
}

function InvoiceRow({ invoice }: { invoice: InvoiceWithClient }) {
  const status = STATUS_CONFIG[invoice.status]

  return (
    <Link href={`/billing/invoices/${invoice.id}`}>
      <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-muted/40 transition-colors group">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="size-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{invoice.number}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${status.class} shrink-0`}>
            {status.label}
          </span>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          {invoice.client ? (
            <>
              <Avatar className="size-5 shrink-0">
                <AvatarImage src={invoice.client.avatar ?? undefined} />
                <AvatarFallback className="text-[9px] bg-muted">
                  {initials(invoice.client.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground truncate">{invoice.client.name}</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        <span className="text-sm text-muted-foreground">{formatDate(invoice.issueDate)}</span>

        <span className={`text-sm ${invoice.status === "OVERDUE" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
        </span>

        <span className="text-sm font-semibold text-foreground text-right">
          {formatCurrency(Number(invoice.total))}
        </span>

        <div onClick={(e) => e.preventDefault()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem>
                <Send className="size-3.5 mr-2" />
                Send invoice
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Eye className="size-3.5 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="size-3.5 mr-2" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Copy className="size-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="size-3.5 mr-2" />
                Void invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Link>
  )
}
