"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Zap, Play, Trash2, ToggleLeft, ToggleRight, ChevronRight, Clock, CheckCircle2, XCircle } from "lucide-react"
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
import { createAutomation, updateAutomation, deleteAutomation, toggleAutomation } from "./actions"
import { format } from "date-fns"

const TRIGGERS = [
  { value: "invoice.overdue",    label: "Invoice becomes overdue" },
  { value: "invoice.paid",       label: "Invoice is paid" },
  { value: "lead.stage_changed", label: "Lead stage changes" },
  { value: "contract.signed",    label: "Contract is signed" },
  { value: "booking.confirmed",  label: "Booking is confirmed" },
  { value: "task.due_soon",      label: "Task due date is within X days" },
  { value: "client.created",     label: "New client is added" },
]

const ACTIONS = [
  { value: "send_notification", label: "Send internal notification" },
  { value: "send_email",        label: "Send email to client" },
  { value: "create_task",       label: "Create a task" },
  { value: "webhook",           label: "Webhook POST to external URL" },
]

type AutomationRun = { status: string; ranAt: string }
type Automation = {
  id: string
  name: string
  description: string | null
  triggerType: string
  isActive: boolean
  lastRunAt: string | null
  runCount: number
  runs: AutomationRun[]
  _count: { runs: number }
}

type ActionItem = { type: string; config: Record<string, string> }

export function AutomationsClient({ automations: initial }: { automations: Automation[] }) {
  const [automations, setAutomations] = React.useState(initial)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [triggerType, setTriggerType] = React.useState("")
  const [actions, setActions] = React.useState<ActionItem[]>([{ type: "send_notification", config: { message: "" } }])

  function resetForm() {
    setName(""); setDescription(""); setTriggerType("")
    setActions([{ type: "send_notification", config: { message: "" } }])
  }

  async function handleSave() {
    setSaving(true)
    const result = await createAutomation({ name, description, triggerType, actions })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success("Automation created")
    setDialogOpen(false)
    resetForm()
    // Refresh
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold">Automations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Automate repetitive tasks with trigger-based rules</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" /> New Automation
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {automations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <Zap className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No automations yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create rules to automate your workflow</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" /> New Automation
            </Button>
          </div>
        ) : (
          <div className="p-6 space-y-3">
            {automations.map((a) => {
              const triggerLabel = TRIGGERS.find((t) => t.value === a.triggerType)?.label ?? a.triggerType
              const lastRun = a.runs[0]
              return (
                <div key={a.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      a.isActive ? "bg-primary/10" : "bg-muted"
                    )}>
                      <Zap className={cn("size-4", a.isActive ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{a.name}</p>
                        <Badge variant={a.isActive ? "default" : "secondary"} className="text-[10px]">
                          {a.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-muted-foreground">
                          When: <span className="text-foreground">{triggerLabel}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Runs: <span className="text-foreground">{a._count.runs}</span>
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
                            Last run {format(new Date(lastRun.ranAt), "MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={a.isActive}
                        onCheckedChange={() => handleToggle(a.id, a.isActive)}
                        className="scale-90"
                      />
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
      </ScrollArea>

      {/* Create Dialog */}
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
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Then do this (Actions)</Label>
              {actions.map((action, i) => (
                <div key={i} className="space-y-2 rounded-lg border border-border p-3">
                  <Select value={action.type} onValueChange={(v) => setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, type: v } : a))}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTIONS.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {action.type === "send_notification" && (
                    <Input
                      className="h-8 text-xs"
                      placeholder="Notification message..."
                      value={action.config.message ?? ""}
                      onChange={(e) => setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, config: { message: e.target.value } } : a))}
                    />
                  )}
                  {action.type === "send_email" && (
                    <Input
                      className="h-8 text-xs"
                      placeholder="Email subject..."
                      value={action.config.subject ?? ""}
                      onChange={(e) => setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, config: { subject: e.target.value } } : a))}
                    />
                  )}
                  {action.type === "webhook" && (
                    <Input
                      className="h-8 text-xs"
                      placeholder="https://..."
                      value={action.config.url ?? ""}
                      onChange={(e) => setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, config: { url: e.target.value } } : a))}
                    />
                  )}
                  {action.type === "create_task" && (
                    <Input
                      className="h-8 text-xs"
                      placeholder="Task title..."
                      value={action.config.title ?? ""}
                      onChange={(e) => setActions((prev) => prev.map((a, idx) => idx === i ? { ...a, config: { title: e.target.value } } : a))}
                    />
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => setActions((prev) => [...prev, { type: "send_notification", config: { message: "" } }])}
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
