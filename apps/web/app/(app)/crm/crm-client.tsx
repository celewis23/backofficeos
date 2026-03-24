"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, MoreHorizontal, DollarSign, TrendingUp, Target, Trophy,
  Mail, Phone, Building2, X, GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency } from "@/lib/utils"
import { createLead, updateLeadStatus, deleteLead } from "./actions"
import type { Lead, LeadStatus } from "@backoffice-os/database"

const COLUMNS: { status: LeadStatus; label: string; color: string; accent: string }[] = [
  { status: "NEW",         label: "New",         color: "text-slate-600",    accent: "bg-slate-100 dark:bg-slate-800" },
  { status: "CONTACTED",   label: "Contacted",   color: "text-blue-600",     accent: "bg-blue-50 dark:bg-blue-900/20" },
  { status: "QUALIFIED",   label: "Qualified",   color: "text-violet-600",   accent: "bg-violet-50 dark:bg-violet-900/20" },
  { status: "PROPOSAL",    label: "Proposal",    color: "text-amber-600",    accent: "bg-amber-50 dark:bg-amber-900/20" },
  { status: "NEGOTIATION", label: "Negotiation", color: "text-orange-600",   accent: "bg-orange-50 dark:bg-orange-900/20" },
  { status: "WON",         label: "Won",         color: "text-green-600",    accent: "bg-green-50 dark:bg-green-900/20" },
  { status: "LOST",        label: "Lost",        color: "text-red-600",      accent: "bg-red-50 dark:bg-red-900/20" },
]

interface CRMClientProps {
  leads: Lead[]
  stats: { total: number; totalValue: number; won: number; wonValue: number }
}

export function CRMClient({ leads: initialLeads, stats }: CRMClientProps) {
  const router = useRouter()
  const [leads, setLeads] = React.useState(initialLeads)
  const [addDialogOpen, setAddDialogOpen] = React.useState(false)
  const [addStatus, setAddStatus] = React.useState<LeadStatus>("NEW")
  const [dragId, setDragId] = React.useState<string | null>(null)
  const [dragOver, setDragOver] = React.useState<LeadStatus | null>(null)

  // Sync with server data
  React.useEffect(() => { setLeads(initialLeads) }, [initialLeads])

  function getColumnLeads(status: LeadStatus) {
    return leads.filter((l) => l.status === status)
  }

  function handleDragStart(id: string) {
    setDragId(id)
  }

  function handleDragOver(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    setDragOver(status)
  }

  async function handleDrop(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault()
    setDragOver(null)
    if (!dragId || leads.find((l) => l.id === dragId)?.status === status) {
      setDragId(null)
      return
    }
    // Optimistic update
    setLeads((prev) => prev.map((l) => l.id === dragId ? { ...l, status } : l))
    setDragId(null)
    const res = await updateLeadStatus(dragId, status)
    if (res.error) {
      toast.error(res.error)
      setLeads(initialLeads)
    }
  }

  async function handleDelete(id: string) {
    setLeads((prev) => prev.filter((l) => l.id !== id))
    const res = await deleteLead(id)
    if (res.error) {
      toast.error(res.error)
      setLeads(initialLeads)
    } else {
      toast.success("Lead removed")
    }
  }

  async function handleMove(id: string, status: LeadStatus) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, status } : l))
    const res = await updateLeadStatus(id, status)
    if (res.error) {
      toast.error(res.error)
      setLeads(initialLeads)
    }
  }

  const winRate = stats.total > 0 ? Math.round((stats.won / stats.total) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">CRM Pipeline</h1>
          <p className="text-sm text-muted-foreground">{stats.total} leads · {formatCurrency(stats.totalValue)} pipeline value</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => { setAddStatus("NEW"); setAddDialogOpen(true) }}>
          <Plus className="size-3.5" />
          Add lead
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-px bg-border border-b border-border shrink-0">
        {[
          { label: "Total leads",    value: stats.total.toString(),          icon: Target,    color: "text-primary" },
          { label: "Pipeline value", value: formatCurrency(stats.totalValue), icon: DollarSign, color: "text-blue-500" },
          { label: "Won",            value: stats.won.toString(),             icon: Trophy,    color: "text-green-500" },
          { label: "Win rate",       value: `${winRate}%`,                   icon: TrendingUp, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="bg-background px-6 py-3">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`size-3.5 ${s.color}`} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-3 p-4 min-w-max">
          {COLUMNS.map((col) => {
            const colLeads = getColumnLeads(col.status)
            const colValue = colLeads.reduce((s, l) => s + Number(l.value ?? 0), 0)
            const isOver = dragOver === col.status

            return (
              <div
                key={col.status}
                className={`flex flex-col w-64 rounded-xl border border-border bg-muted/30 transition-colors ${isOver ? "bg-primary/5 border-primary/40" : ""}`}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDrop={(e) => handleDrop(e, col.status)}
                onDragLeave={() => setDragOver(null)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${col.color}`}>{col.label}</span>
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">
                      {colLeads.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {colValue > 0 && (
                      <span className="text-[10px] text-muted-foreground">{formatCurrency(colValue)}</span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-5"
                      onClick={() => { setAddStatus(col.status); setAddDialogOpen(true) }}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {colLeads.map((lead) => (
                    <LeadCard
                      key={lead.id}
                      lead={lead}
                      columns={COLUMNS}
                      onDragStart={() => handleDragStart(lead.id)}
                      onMove={handleMove}
                      onDelete={handleDelete}
                    />
                  ))}
                  {colLeads.length === 0 && (
                    <div
                      className="flex items-center justify-center h-16 rounded-lg border-2 border-dashed border-border cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => { setAddStatus(col.status); setAddDialogOpen(true) }}
                    >
                      <Plus className="size-3.5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddLeadDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        defaultStatus={addStatus}
        onCreated={(lead) => {
          setLeads((prev) => [lead as Lead, ...prev])
          router.refresh()
        }}
      />
    </div>
  )
}

function LeadCard({
  lead, columns, onDragStart, onMove, onDelete,
}: {
  lead: Lead
  columns: typeof COLUMNS
  onDragStart: () => void
  onMove: (id: string, status: LeadStatus) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-background rounded-lg border border-border p-3 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-tight truncate">{lead.name}</p>
          {lead.company && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <Building2 className="size-2.5 shrink-0" />
              {lead.company}
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              <MoreHorizontal className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
              Move to
            </div>
            {columns
              .filter((c) => c.status !== lead.status)
              .map((c) => (
                <DropdownMenuItem key={c.status} onClick={() => onMove(lead.id, c.status)}>
                  <span className={`text-xs ${c.color}`}>{c.label}</span>
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(lead.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 space-y-1">
        {lead.email && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Mail className="size-2.5 shrink-0" />
            <span className="truncate">{lead.email}</span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Phone className="size-2.5 shrink-0" />
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.value && Number(lead.value) > 0 && (
        <div className="mt-2 pt-2 border-t border-border">
          <span className="text-xs font-semibold text-foreground">
            {formatCurrency(Number(lead.value))}
          </span>
        </div>
      )}
    </div>
  )
}

function AddLeadDialog({
  open, onOpenChange, defaultStatus, onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  defaultStatus: LeadStatus
  onCreated: (lead: Partial<Lead>) => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [company, setCompany] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [value, setValue] = React.useState("")
  const [source, setSource] = React.useState("")
  const [notes, setNotes] = React.useState("")

  function reset() {
    setName(""); setCompany(""); setEmail(""); setPhone("")
    setValue(""); setSource(""); setNotes("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const res = await createLead({
      name: name.trim(),
      company: company.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      value: value ? parseFloat(value) : undefined,
      source: source.trim() || undefined,
      notes: notes.trim() || undefined,
      status: defaultStatus,
    })
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Lead added")
      onCreated({ name, company, email, phone, status: defaultStatus })
      reset()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add lead</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="Contact or company name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Input placeholder="Acme Corp" value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Deal value</Label>
              <Input type="number" placeholder="5000" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="contact@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Source</Label>
              <Input placeholder="Website, referral, cold outreach..." value={source} onChange={(e) => setSource(e.target.value)} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Any context or notes..." rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Add lead</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
