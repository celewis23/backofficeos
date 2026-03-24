"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Plus, Search, Receipt, TrendingDown, Clock, CheckCircle2,
  MoreHorizontal, Trash2, Building2, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { createExpense, deleteExpense, createVendor, deleteVendor } from "./actions"

const CATEGORIES = [
  "SOFTWARE", "CONTRACTOR", "EQUIPMENT", "RENT",
  "UTILITIES", "TRAVEL", "MARKETING", "MEALS", "OTHER",
] as const

const CATEGORY_LABELS: Record<string, string> = {
  SOFTWARE: "Software", CONTRACTOR: "Contractor", EQUIPMENT: "Equipment",
  RENT: "Rent", UTILITIES: "Utilities", TRAVEL: "Travel",
  MARKETING: "Marketing", MEALS: "Meals & Entertainment", OTHER: "Other",
}

const STATUS_CONFIG = {
  PENDING: { label: "Pending", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  PAID: { label: "Paid", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  VOIDED: { label: "Voided", class: "bg-muted text-muted-foreground" },
}

type Expense = {
  id: string
  vendorName: string
  category: string
  amount: number | string | { toString(): string }
  currency: string
  date: Date
  paymentMethod: string
  status: string
  notes: string | null
  receiptUrl: string | null
  vendor: { id: string; name: string } | null
  project: { id: string; name: string } | null
}

type Vendor = {
  id: string
  name: string
  email: string | null
  phone: string | null
  website: string | null
  paymentTerms: number | null
  notes: string | null
}

interface ExpensesClientProps {
  expenses: Expense[]
  vendors: Vendor[]
  projects: { id: string; name: string }[]
  stats: { totalPaid: number; totalPending: number; totalCount: number }
}

export function ExpensesClient({ expenses, vendors, projects, stats }: ExpensesClientProps) {
  const [tab, setTab] = React.useState("expenses")
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [addExpenseOpen, setAddExpenseOpen] = React.useState(false)
  const [addVendorOpen, setAddVendorOpen] = React.useState(false)

  const filtered = expenses.filter((e) => {
    const matchesSearch =
      search === "" ||
      e.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      (e.notes ?? "").toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter
    const matchesStatus = statusFilter === "all" || e.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Expenses</h1>
          <p className="text-sm text-muted-foreground">{stats.totalCount} total expenses</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddExpenseOpen(true)}>
          <Plus className="size-3.5" />
          Add expense
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border border-b border-border shrink-0">
        {[
          { label: "Paid this month", value: formatCurrency(stats.totalPaid), icon: CheckCircle2, color: "text-green-500" },
          { label: "Pending", value: formatCurrency(stats.totalPending), icon: Clock, color: "text-amber-500" },
          { label: "Total expenses", value: stats.totalCount.toString(), icon: Receipt, color: "text-muted-foreground" },
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

      {/* Tabs + filters */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="expenses" className="text-xs px-3">Expenses</TabsTrigger>
            <TabsTrigger value="vendors" className="text-xs px-3">Vendors</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "expenses" && (
          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search expenses..."
                className="pl-9 h-8 w-48 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="h-8 w-36 text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-28 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="VOIDED">Voided</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {tab === "vendors" && (
          <Button size="sm" variant="outline" className="ml-auto gap-1.5 h-8 text-xs" onClick={() => setAddVendorOpen(true)}>
            <Plus className="size-3.5" />
            Add vendor
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === "expenses" && (
          <>
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30 sticky top-0">
              <span>Vendor / Description</span>
              <span>Category</span>
              <span>Date</span>
              <span>Project</span>
              <span className="text-right">Amount</span>
              <span />
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Receipt className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No expenses found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {search || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Add your first expense to get started"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((expense) => {
                  const status = STATUS_CONFIG[expense.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.PENDING
                  return (
                    <div key={expense.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-muted/40 transition-colors group">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{expense.vendorName}</p>
                        {expense.notes && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{expense.notes}</p>
                        )}
                        <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full mt-1 ${status.class}`}>
                          {status.label}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">{CATEGORY_LABELS[expense.category] ?? expense.category}</span>
                      <span className="text-sm text-muted-foreground">{formatDate(expense.date)}</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {expense.project?.name ?? <span className="text-muted-foreground/50">—</span>}
                      </span>
                      <span className="text-sm font-semibold text-foreground text-right">
                        {formatCurrency(Number(expense.amount))}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem
                            destructive
                            onClick={async () => {
                              const res = await deleteExpense(expense.id)
                              if (res.error) toast.error(res.error)
                              else toast.success("Expense deleted")
                            }}
                          >
                            <Trash2 className="size-3.5 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === "vendors" && (
          <div className="divide-y divide-border">
            {vendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Building2 className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No vendors yet</p>
                <p className="text-xs text-muted-foreground mt-1">Add vendors to track recurring expenses</p>
              </div>
            ) : (
              vendors.map((vendor) => (
                <div key={vendor.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center">
                      <Building2 className="size-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[vendor.email, vendor.phone].filter(Boolean).join(" · ") || "No contact info"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendor.paymentTerms && (
                      <Badge variant="outline" className="text-[10px]">Net {vendor.paymentTerms}</Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                          destructive
                          onClick={async () => {
                            const res = await deleteVendor(vendor.id)
                            if (res.error) toast.error(res.error)
                            else toast.success("Vendor deleted")
                          }}
                        >
                          <Trash2 className="size-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <AddExpenseDialog
        open={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        vendors={vendors}
        projects={projects}
      />
      <AddVendorDialog
        open={addVendorOpen}
        onClose={() => setAddVendorOpen(false)}
      />
    </div>
  )
}

function AddExpenseDialog({
  open, onClose, vendors, projects,
}: {
  open: boolean
  onClose: () => void
  vendors: { id: string; name: string }[]
  projects: { id: string; name: string }[]
}) {
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    vendorName: "", vendorId: "", category: "OTHER", amount: "",
    date: new Date().toISOString().slice(0, 10), paymentMethod: "OTHER",
    status: "PENDING", notes: "", projectId: "",
  })

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createExpense(form)
      if (res.error) { toast.error(res.error); return }
      toast.success("Expense added")
      onClose()
      setForm({ vendorName: "", vendorId: "", category: "OTHER", amount: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "OTHER", status: "PENDING", notes: "", projectId: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor name</Label>
              <Input
                placeholder="e.g. Adobe, AWS, Contractor..."
                value={form.vendorName}
                onChange={(e) => set("vendorName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount</Label>
              <Input
                type="number" step="0.01" placeholder="0.00"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="VOIDED">Voided</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={form.paymentMethod} onValueChange={(v) => set("paymentMethod", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="STRIPE">Stripe</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {projects.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <Label>Link to project <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={form.projectId} onValueChange={(v) => set("projectId", v)}>
                  <SelectTrigger><SelectValue placeholder="No project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No project</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="col-span-2 space-y-1.5">
              <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Textarea
                placeholder="Add notes..."
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add expense</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function AddVendorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [loading, setLoading] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "", email: "", phone: "", website: "", paymentTerms: "", notes: "",
  })

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createVendor(form)
      if (res.error) { toast.error(res.error); return }
      toast.success("Vendor added")
      onClose()
      setForm({ name: "", email: "", phone: "", website: "", paymentTerms: "", notes: "" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Vendor name</Label>
              <Input placeholder="Adobe Inc." value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="billing@vendor.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://vendor.com" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment terms (days)</Label>
              <Input type="number" placeholder="30" value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>Add vendor</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
