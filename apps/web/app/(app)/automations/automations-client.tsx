"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Plus, Zap, Trash2, Clock, CheckCircle2, XCircle, Edit2, Sparkles,
  Search, Activity, TrendingUp, BarChart2, ChevronDown, ChevronUp, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { createAutomation, deleteAutomation, toggleAutomation } from "./actions"
import { format, formatDistanceToNow } from "date-fns"

// ─── Trigger map ────────────────────────────────────────────────────────────

const TRIGGER_LABELS: Record<string, string> = {
  // builder format (underscore)
  invoice_overdue:    "Invoice overdue",
  invoice_paid_full:  "Invoice paid",
  lead_stage_changed: "Lead stage changed",
  lead_won:           "Lead won",
  lead_lost:          "Lead lost",
  contract_signed:    "Contract signed",
  booking_confirmed:  "Booking confirmed",
  client_created:     "New client added",
  // legacy format (dot notation) — kept for old records
  "invoice.overdue":    "Invoice overdue",
  "invoice.paid":       "Invoice paid",
  "lead.stage_changed": "Lead stage changed",
  "contract.signed":    "Contract signed",
  "booking.confirmed":  "Booking confirmed",
  "task.due_soon":      "Task due soon",
  "client.created":     "New client added",
}

const LEGACY_TRIGGERS = [
  { value: "invoice.overdue",    label: "Invoice becomes overdue" },
  { value: "invoice.paid",       label: "Invoice is paid" },
  { value: "lead.stage_changed", label: "Lead stage changes" },
  { value: "contract.signed",    label: "Contract is signed" },
  { value: "booking.confirmed",  label: "Booking is confirmed" },
  { value: "task.due_soon",      label: "Task due date is within X days" },
  { value: "client.created",     label: "New client is added" },
]

const LEGACY_ACTIONS = [
  { value: "send_notification", label: "Send internal notification" },
  { value: "send_email",        label: "Send email to client" },
  { value: "create_task",       label: "Create a task" },
  { value: "webhook",           label: "Webhook POST to external URL" },
]

// ─── Types ───────────────────────────────────────────────────────────────────

type RunSnap = { status: string; ranAt: Date | string }
type Automation = {
  id: string
  name: string
  description: string | null
  triggerType: string
  isActive: boolean
  lastRunAt: Date | string | null
  runCount: number
  runs: RunSnap[]
  _count: { runs: number }
}

type RecentRun = {
  id: string
  status: string
  ranAt: Date | string
  entityType: string | null
  automation: { id: string; name: string }
}

type Stats = {
  total: number
  active: number
  runsThisWeek: number
  successRate: number | null
  pendingApprovals: number
}

type ActionItem = { type: string; config: Record<string, string> }

// ─── Run dots ────────────────────────────────────────────────────────────────

function RunDots({ runs }: { runs: RunSnap[] }) {
  if (runs.length === 0) return null
  return (
    <div className="flex items-center gap-0.5">
      {runs.slice(0, 7).reverse().map((r, i) => (
        <span
          key={i}
          title={`${r.status} — ${format(new Date(r.ranAt), "MMM d, HH:mm")}`}
          className={cn(
            "inline-block size-2 rounded-full",
            r.status === "SUCCESS"  ? "bg-green-500" :
            r.status === "FAILURE"  ? "bg-red-500"   :
            r.status === "PARTIAL"  ? "bg-yellow-500" :
                                      "bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  )
}

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon }: {
  label: string
  value: string | number
  sub?: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 flex items-start gap-2.5">
      <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 text-primary mt-0.5">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
        <p className="text-base font-semibold leading-none">{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AutomationsClient({
  automations: initial,
  stats,
  recentRuns,
}: {
  automations: Automation[]
  stats: Stats
  recentRuns: RecentRun[]
}) {
  const router = useRouter()
  const [automations, setAutomations] = React.useState(initial)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Filters
  const [filter, setFilter] = React.useState<"all" | "active" | "paused">("all")
  const [search, setSearch] = React.useState("")

  // Run log
  const [logExpanded, setLogExpanded] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [triggerType, setTriggerType] = React.useState("")
  const [legacyActions, setLegacyActions] = React.useState<ActionItem[]>([
    { type: "send_notification", config: { message: "" } },
  ])

  function resetForm() {
    setName(""); setDescription(""); setTriggerType("")
    setLegacyActions([{ type: "send_notification", config: { message: "" } }])
  }

  async function handleSave() {
    setSaving(true)
    const result = await createAutomation({ name, description, triggerType, actions: legacyActions })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success("Automation created")
    setDialogOpen(false)
    resetForm()
    window.location.reload()
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleAutomation(id, !current)
    setAutomations((prev) => prev.map((a) => a.id === id ? { ...a, isActive: !current } : a))
  }

  async function handleDelete(id: string) {
    await deleteAutomation(id)
    setAutomations((prev) => prev.filter((a) => a.id !== id))
    toast.success("Automation deleted")
  }

  const filtered = automations.filter((a) => {
    if (filter === "active" && !a.isActive) return false
    if (filter === "paused" && a.isActive) return false
    if (search) {
      const q = search.toLowerCase()
      return a.name.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold">Automations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Automate repetitive tasks with trigger-based rules</p>
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingApprovals > 0 && (
            <Button size="sm" variant="outline" className="gap-1.5 relative" asChild>
              <Link href="/automations/approvals">
                <ShieldCheck className="size-3.5" />
                Approvals
                <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-yellow-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                  {stats.pendingApprovals}
                </span>
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" className="gap-1.5" asChild>
            <Link href="/automations/templates">
              <Sparkles className="size-3.5" /> Templates
            </Link>
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => router.push("/automations/new/builder")}>
            <Plus className="size-3.5" /> New Automation
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-5">

          {/* Stats cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total automations"
              value={stats.total}
              icon={<Zap className="size-3.5" />}
            />
            <StatCard
              label="Active"
              value={stats.active}
              sub={stats.total > 0 ? `${Math.round((stats.active / stats.total) * 100)}% of total` : undefined}
              icon={<Activity className="size-3.5" />}
            />
            <StatCard
              label="Runs this week"
              value={stats.runsThisWeek}
              icon={<BarChart2 className="size-3.5" />}
            />
            <StatCard
              label="Success rate"
              value={stats.successRate !== null ? `${stats.successRate}%` : "—"}
              sub="last 7 days"
              icon={<TrendingUp className="size-3.5" />}
            />
          </div>

          {/* Filter toolbar */}
          {automations.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center rounded-md border border-border p-0.5 gap-0.5">
                {(["all", "active", "paused"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize",
                      filter === f
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search automations…"
                  className="h-7 pl-8 text-xs"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {filtered.length} {filtered.length === 1 ? "automation" : "automations"}
              </span>
            </div>
          )}

          {/* Automation list */}
          {automations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Zap className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">No automations yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create rules to automate your workflow</p>
              <div className="flex items-center gap-2 mt-4">
                <Button size="sm" variant="outline" className="gap-1.5" asChild>
                  <Link href="/automations/templates">
                    <Sparkles className="size-3.5" /> Browse Templates
                  </Link>
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => router.push("/automations/new/builder")}>
                  <Plus className="size-3.5" /> New Automation
                </Button>
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">No automations match your filter</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => { setFilter("all"); setSearch("") }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((a) => {
                const triggerLabel = TRIGGER_LABELS[a.triggerType] ?? a.triggerType
                const lastRun = a.runs[0]
                return (
                  <div key={a.id} className="rounded-lg border border-border p-4 hover:border-border/80 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                        a.isActive ? "bg-primary/10" : "bg-muted"
                      )}>
                        <Zap className={cn("size-4", a.isActive ? "text-primary" : "text-muted-foreground")} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{a.name}</p>
                          <Badge
                            variant={a.isActive ? "default" : "secondary"}
                            className="text-[10px] h-4"
                          >
                            {a.isActive ? "Active" : "Paused"}
                          </Badge>
                        </div>
                        {a.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.description}</p>
                        )}

                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            Trigger: <span className="text-foreground">{triggerLabel}</span>
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {a._count.runs} run{a._count.runs !== 1 ? "s" : ""}
                          </span>
                          {lastRun && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              {lastRun.status === "SUCCESS" ? (
                                <CheckCircle2 className="size-3 text-green-500" />
                              ) : lastRun.status === "FAILURE" ? (
                                <XCircle className="size-3 text-red-500" />
                              ) : (
                                <Clock className="size-3" />
                              )}
                              {formatDistanceToNow(new Date(lastRun.ranAt), { addSuffix: true })}
                            </span>
                          )}
                        </div>

                        {/* Run history dots */}
                        {a.runs.length > 0 && (
                          <div className="mt-2">
                            <RunDots runs={a.runs} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Switch
                          checked={a.isActive}
                          onCheckedChange={() => handleToggle(a.id, a.isActive)}
                          className="scale-90"
                        />
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/automations/${a.id}/builder`}>
                            <Edit2 className="size-3.5" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Recent Activity log */}
          {recentRuns.length > 0 && (
            <div className="rounded-lg border border-border">
              <button
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
                onClick={() => setLogExpanded((v) => !v)}
              >
                <span className="text-xs font-medium">Recent Activity</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{recentRuns.length} runs</span>
                  {logExpanded
                    ? <ChevronUp className="size-3.5 text-muted-foreground" />
                    : <ChevronDown className="size-3.5 text-muted-foreground" />
                  }
                </div>
              </button>

              {logExpanded && (
                <div className="border-t border-border divide-y divide-border">
                  {recentRuns.map((run) => (
                    <div key={run.id} className="flex items-center gap-3 px-4 py-2.5">
                      {run.status === "SUCCESS" ? (
                        <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />
                      ) : run.status === "FAILURE" ? (
                        <XCircle className="size-3.5 text-red-500 shrink-0" />
                      ) : run.status === "PARTIAL" ? (
                        <Clock className="size-3.5 text-yellow-500 shrink-0" />
                      ) : (
                        <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{run.automation.name}</p>
                        {run.entityType && (
                          <p className="text-[10px] text-muted-foreground capitalize">{run.entityType}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className={cn(
                          "text-[10px] font-medium",
                          run.status === "SUCCESS" ? "text-green-600 dark:text-green-400" :
                          run.status === "FAILURE" ? "text-red-600 dark:text-red-400" :
                          "text-muted-foreground"
                        )}>
                          {run.status}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(run.ranAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </ScrollArea>

      {/* Create Dialog (legacy quick-create) */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New Automation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input placeholder="e.g. Send email when invoice is paid" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
              <Input placeholder="What does this automation do?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>When this happens (Trigger)</Label>
              <Select value={triggerType} onValueChange={setTriggerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger..." />
                </SelectTrigger>
                <SelectContent>
                  {LEGACY_TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Then do this (Actions)</Label>
              {legacyActions.map((action, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <Select
                    value={action.type}
                    onValueChange={(v) =>
                      setLegacyActions((prev) => prev.map((a, idx) => idx === i ? { ...a, type: v } : a))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEGACY_ACTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {action.type === "send_notification" && (
                    <Input className="h-8 text-xs" placeholder="Notification message..."
                      value={action.config.message ?? ""}
                      onChange={(e) => setLegacyActions((prev) =>
                        prev.map((a, idx) => idx === i ? { ...a, config: { message: e.target.value } } : a)
                      )}
                    />
                  )}
                  {action.type === "send_email" && (
                    <Input className="h-8 text-xs" placeholder="Email subject..."
                      value={action.config.subject ?? ""}
                      onChange={(e) => setLegacyActions((prev) =>
                        prev.map((a, idx) => idx === i ? { ...a, config: { subject: e.target.value } } : a)
                      )}
                    />
                  )}
                  {action.type === "webhook" && (
                    <Input className="h-8 text-xs" placeholder="https://..."
                      value={action.config.url ?? ""}
                      onChange={(e) => setLegacyActions((prev) =>
                        prev.map((a, idx) => idx === i ? { ...a, config: { url: e.target.value } } : a)
                      )}
                    />
                  )}
                  {action.type === "create_task" && (
                    <Input className="h-8 text-xs" placeholder="Task title..."
                      value={action.config.title ?? ""}
                      onChange={(e) => setLegacyActions((prev) =>
                        prev.map((a, idx) => idx === i ? { ...a, config: { title: e.target.value } } : a)
                      )}
                    />
                  )}
                </div>
              ))}
              <Button
                variant="outline" size="sm" className="w-full text-xs"
                onClick={() => setLegacyActions((prev) => [
                  ...prev, { type: "send_notification", config: { message: "" } }
                ])}
              >
                <Plus className="size-3.5 mr-1.5" /> Add another action
              </Button>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !name || !triggerType}>
                {saving ? "Saving..." : "Create Automation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
