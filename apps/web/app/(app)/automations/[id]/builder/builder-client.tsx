"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, Save, Play, Zap, Clock, GitBranch, Mail, MessageSquare,
  CheckSquare, Tag, Bell, Plus, X, CircleDot, Sparkles,
  ClipboardList, FileSignature, Receipt, CalendarDays, FolderKanban,
  Globe, Archive, Hash, Webhook, CheckCircle2, XCircle, AlertCircle,
  Loader2, SkipForward, PauseCircle, ArrowRight, RefreshCw,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  SelectGroup, SelectLabel,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  type AutomationGraph, type AutomationNode, type AutomationNodeType,
  type ActionConfig, type ConditionConfig, type DelayConfig, type TriggerConfig,
  type OnError,
  makeNodeId, nodeTitle, nodeSubtitle,
  TRIGGER_TYPES, ACTION_TYPES, CONDITION_FIELDS, CONDITION_OPERATORS,
  emptyGraph,
} from "@/lib/automation-types"
import { saveBuilderAutomation } from "./actions"

// ─── SERIALIZED TYPES ─────────────────────────────────────────────────────────

type RunStep = {
  id: string; nodeId: string; nodeType: string; status: string
  error: string | null; executedAt: string | null
}
type Run = {
  id: string; status: string; entityType: string | null; entityId: string | null
  dryRun: boolean; ranAt: string; completedAt: string | null; steps: RunStep[]
}
type BuilderAutomation = {
  id: string; name: string; triggerType: string; isActive: boolean
  nodes: unknown; runs: Run[]
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const NODE_STYLES: Record<AutomationNodeType, { bg: string; border: string; badge: string }> = {
  trigger:   { bg: "bg-amber-50 dark:bg-amber-950/20",  border: "border-amber-200 dark:border-amber-800",  badge: "bg-amber-100 text-amber-700" },
  delay:     { bg: "bg-muted/40",                        border: "border-border",                           badge: "bg-secondary text-secondary-foreground" },
  condition: { bg: "bg-green-50 dark:bg-green-950/20",  border: "border-green-200 dark:border-green-800",  badge: "bg-green-100 text-green-700" },
  action:    { bg: "bg-blue-50 dark:bg-blue-950/20",    border: "border-blue-200 dark:border-blue-800",    badge: "bg-blue-100 text-blue-700" },
}

const TYPE_ICONS: Record<AutomationNodeType, React.ElementType> = {
  trigger: Zap, delay: Clock, condition: GitBranch, action: CircleDot,
}

const ACTION_ICONS: Record<string, React.ElementType> = {
  send_email: Mail, send_sms: MessageSquare, send_form: ClipboardList,
  send_contract: FileSignature, send_invoice: Receipt, send_scheduler: CalendarDays,
  create_task: CheckSquare, change_project_status: FolderKanban,
  move_lead_stage: ArrowRight, add_client_tag: Tag, remove_client_tag: Tag,
  activate_portal: Globe, archive_project: Archive, apply_workflow: RefreshCw,
  pause_workflow: PauseCircle, send_internal_notification: Bell,
  post_slack: Hash, webhook_post: Webhook,
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function parseGraph(raw: unknown): AutomationGraph {
  if (raw && typeof raw === "object" && "nodes" in (raw as object) && Array.isArray((raw as AutomationGraph).nodes)) {
    return raw as AutomationGraph
  }
  return emptyGraph()
}

function getDefaultConfig(type: AutomationNodeType, actionType?: string): Record<string, unknown> {
  switch (type) {
    case "trigger":   return { trigger_type: "manual", trigger_config: {} }
    case "delay":     return { amount: 1, unit: "days", mode: "relative", condition: "immediately" }
    case "condition": return { logic: "all", conditions: [{ field: "project.budget", operator: "greater_than", value: "" }], on_error: "skip" }
    case "action":    return { action_type: actionType ?? "send_email", action_config: { to: "client", subject: "", body_html: "" }, require_approval: false, on_error: "skip" }
    default:          return {}
  }
}

// ─── PALETTE ──────────────────────────────────────────────────────────────────

const PALETTE_LOGIC = [
  { type: "condition" as AutomationNodeType, label: "Condition (if/else)", icon: GitBranch },
  { type: "delay"     as AutomationNodeType, label: "Delay",               icon: Clock },
]

function Palette({
  onDragStart,
  onClickItem,
  activeItemKey,
}: {
  onDragStart: (e: React.DragEvent, type: AutomationNodeType, actionType?: string) => void
  onClickItem: (type: AutomationNodeType, actionType?: string) => void
  activeItemKey: string | null
}) {
  return (
    <aside className="w-[196px] shrink-0 border-r border-border flex flex-col overflow-y-auto bg-muted/10">
      {/* Triggers */}
      <div className="px-3 pt-4 pb-2">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Triggers</p>
        <div className="space-y-0.5">
          {TRIGGER_TYPES.slice(0, 9).map((t) => {
            const key = `trigger:${t.value}`
            const active = activeItemKey === key
            return (
              <div
                key={t.value}
                draggable
                onDragStart={(e) => onDragStart(e, "trigger", t.value)}
                onClick={() => onClickItem("trigger", t.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing text-xs transition-colors select-none border",
                  active
                    ? "bg-amber-100 border-amber-300 text-amber-800"
                    : "border-transparent hover:bg-amber-50 text-muted-foreground hover:text-amber-700"
                )}
              >
                <Zap className={cn("size-3 shrink-0", active ? "text-amber-600" : "text-amber-400")} />
                <span className="truncate leading-tight">{t.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Separator className="mx-3 my-1 w-auto" />

      {/* Logic */}
      <div className="px-3 py-2">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Logic</p>
        <div className="space-y-0.5">
          {PALETTE_LOGIC.map((item) => {
            const key = `${item.type}:`
            const active = activeItemKey === key
            const Icon = item.icon
            const s = NODE_STYLES[item.type]
            return (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => onDragStart(e, item.type)}
                onClick={() => onClickItem(item.type)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing text-xs transition-colors select-none border",
                  active ? `${s.bg} ${s.border} text-foreground` : "border-transparent hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-3 shrink-0" />
                <span className="truncate">{item.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <Separator className="mx-3 my-1 w-auto" />

      {/* Actions */}
      <div className="px-3 py-2 pb-4">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Actions</p>
        <div className="space-y-0.5">
          {ACTION_TYPES.map((a) => {
            const key = `action:${a.value}`
            const active = activeItemKey === key
            const Icon = ACTION_ICONS[a.value] ?? CircleDot
            return (
              <div
                key={a.value}
                draggable
                onDragStart={(e) => onDragStart(e, "action", a.value)}
                onClick={() => onClickItem("action", a.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 rounded cursor-grab active:cursor-grabbing text-xs transition-colors select-none border",
                  active
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "border-transparent hover:bg-blue-50 text-muted-foreground hover:text-blue-700"
                )}
              >
                <Icon className="size-3 shrink-0" />
                <span className="truncate">{a.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

// ─── NODE CARD ────────────────────────────────────────────────────────────────

function NodeCard({
  node, isSelected, onSelect, onDelete,
}: {
  node: AutomationNode; isSelected: boolean; onSelect: () => void; onDelete: () => void
}) {
  const s = NODE_STYLES[node.type]
  const TypeIcon =
    node.type === "action"
      ? (ACTION_ICONS[(node.config as ActionConfig).action_type] ?? CircleDot)
      : TYPE_ICONS[node.type]
  const title = nodeTitle(node)
  const subtitle = nodeSubtitle(node)

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative w-60 rounded-xl border-2 p-3.5 cursor-pointer transition-all shadow-sm hover:shadow-md",
        s.bg, s.border,
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
    >
      {node.type !== "trigger" && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute -top-2 -right-2 size-5 rounded-full bg-destructive text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
        >
          <X className="size-2.5" />
        </button>
      )}
      <div className="flex items-start gap-2.5">
        <div className={cn("size-7 rounded-lg flex items-center justify-center shrink-0", s.badge)}>
          <TypeIcon className="size-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full", s.badge)}>
              {node.type}
            </span>
          </div>
          <p className="text-xs font-semibold leading-tight truncate">{title}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight truncate">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}

// ─── ADD STEP BUTTON ──────────────────────────────────────────────────────────

function AddStepButton({
  afterId, branch, onInsert, activePaletteItem, isDragOver, onDragOver, onDragLeave, onDrop,
}: {
  afterId: string
  branch?: "yes" | "no"
  onInsert: (afterId: string, type: AutomationNodeType, branch?: "yes" | "no", actionType?: string) => void
  activePaletteItem: { type: AutomationNodeType; actionType?: string } | null
  isDragOver: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, afterId: string, branch?: "yes" | "no") => void
}) {
  const [open, setOpen] = React.useState(false)

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (activePaletteItem) {
      onInsert(afterId, activePaletteItem.type, branch, activePaletteItem.actionType)
      return
    }
    setOpen(true)
  }

  const label = activePaletteItem
    ? activePaletteItem.type === "action"
      ? ACTION_TYPES.find(a => a.value === activePaletteItem.actionType)?.label ?? "Action"
      : activePaletteItem.type === "condition" ? "Condition" : "Delay"
    : "Add step"

  return (
    <div className="flex flex-col items-center">
      <div className="w-px h-5 bg-border" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={handleClick}
            onDragOver={(e) => { e.preventDefault(); onDragOver(e) }}
            onDragLeave={onDragLeave}
            onDrop={(e) => { e.stopPropagation(); onDrop(e, afterId, branch) }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-dashed text-xs font-medium transition-all",
              isDragOver
                ? "border-primary bg-primary/10 text-primary scale-110"
                : activePaletteItem
                ? "border-primary bg-primary/5 text-primary hover:bg-primary/10"
                : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Plus className="size-3" />
            {label}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="center" side="bottom">
          <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">Insert step</p>
          <div className="space-y-0.5">
            <p className="text-[9px] font-semibold text-muted-foreground px-1 mt-1">Logic</p>
            {PALETTE_LOGIC.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.type}
                  onClick={() => { onInsert(afterId, item.type, branch); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                >
                  <Icon className="size-3.5 text-muted-foreground" />{item.label}
                </button>
              )
            })}
            <p className="text-[9px] font-semibold text-muted-foreground px-1 mt-2">Actions</p>
            {ACTION_TYPES.slice(0, 10).map((a) => {
              const Icon = ACTION_ICONS[a.value] ?? CircleDot
              return (
                <button
                  key={a.value}
                  onClick={() => { onInsert(afterId, "action", branch, a.value); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors"
                >
                  <Icon className="size-3.5 text-muted-foreground" />{a.label}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ─── CANVAS FLOW ──────────────────────────────────────────────────────────────

function CanvasFlow({
  graph, selectedNodeId, onSelectNode, onInsert, onDelete,
  activePaletteItem, dragOverTarget, onDragOver, onDragLeave, onDrop,
}: {
  graph: AutomationGraph; selectedNodeId: string | null
  onSelectNode: (id: string) => void
  onInsert: (afterId: string, type: AutomationNodeType, branch?: "yes" | "no", actionType?: string) => void
  onDelete: (id: string) => void
  activePaletteItem: { type: AutomationNodeType; actionType?: string } | null
  dragOverTarget: string | null
  onDragOver: (e: React.DragEvent, key: string) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, afterId: string, branch?: "yes" | "no") => void
}) {
  const triggerNode = graph.nodes.find((n) => n.id === "trigger")
  const visited = React.useRef(new Set<string>())

  function renderChain(
    nodeId: string | null | undefined,
    afterId: string,
    branch?: "yes" | "no"
  ): React.ReactNode {
    const dropKey = `${afterId}:${branch ?? "main"}`

    if (!nodeId) {
      return (
        <AddStepButton
          afterId={afterId} branch={branch} onInsert={onInsert}
          activePaletteItem={activePaletteItem}
          isDragOver={dragOverTarget === dropKey}
          onDragOver={(e) => onDragOver(e, dropKey)}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        />
      )
    }

    // Guard against cycles
    if (visited.current.has(nodeId)) return null
    visited.current.add(nodeId)

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return (
      <AddStepButton
        afterId={afterId} branch={branch} onInsert={onInsert}
        activePaletteItem={activePaletteItem}
        isDragOver={dragOverTarget === dropKey}
        onDragOver={(e) => onDragOver(e, dropKey)}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      />
    )

    return (
      <>
        {/* Connector */}
        <div className="w-px h-6 bg-border/60" />
        {/* Arrowhead */}
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border/60 -mt-1 mb-0" />

        {/* Node */}
        <NodeCard
          node={node}
          isSelected={selectedNodeId === node.id}
          onSelect={() => onSelectNode(node.id)}
          onDelete={() => onDelete(node.id)}
        />

        {/* Branches or continuation */}
        {node.type === "condition" ? (
          <div className="flex flex-col items-center w-full">
            {/* Fork visual */}
            <div className="w-px h-4 bg-border/60" />
            <div className="flex gap-4 items-start">
              {/* Yes branch */}
              <div className="flex flex-col items-center min-w-[220px]">
                <div className="w-px h-3 bg-green-300" />
                <span className="text-[10px] font-semibold text-green-600 bg-green-100 border border-green-200 rounded-full px-2 py-0.5 mb-0.5">
                  ✓ Yes
                </span>
                <div className="flex flex-col items-center w-full">
                  {renderChain(node.branches?.yes, node.id, "yes")}
                </div>
              </div>
              {/* No branch */}
              <div className="flex flex-col items-center min-w-[220px]">
                <div className="w-px h-3 bg-red-300" />
                <span className="text-[10px] font-semibold text-red-600 bg-red-100 border border-red-200 rounded-full px-2 py-0.5 mb-0.5">
                  ✗ No
                </span>
                <div className="flex flex-col items-center w-full">
                  {renderChain(node.branches?.no, node.id, "no")}
                </div>
              </div>
            </div>
            {/* If there's a node after the condition, show it */}
            {node.next && renderChain(node.next, node.id)}
          </div>
        ) : (
          renderChain(node.next, node.id)
        )}
      </>
    )
  }

  // Reset visited on each render
  React.useLayoutEffect(() => { visited.current = new Set() })

  return (
    <div className="flex flex-col items-center py-10 px-8 min-h-full min-w-max mx-auto">
      {triggerNode ? (
        <>
          <NodeCard
            node={triggerNode}
            isSelected={selectedNodeId === "trigger"}
            onSelect={() => onSelectNode("trigger")}
            onDelete={() => {}}
          />
          {renderChain(triggerNode.next, "trigger")}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No trigger node. Reload the page.</p>
      )}
    </div>
  )
}

// ─── INSPECTOR: TRIGGER ───────────────────────────────────────────────────────

function TriggerConfigForm({ config, onChange }: { config: TriggerConfig; onChange: (u: Partial<TriggerConfig>) => void }) {
  const groups = [...new Set(TRIGGER_TYPES.map((t) => t.group))]
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Trigger event</Label>
        <Select value={config.trigger_type} onValueChange={(v) => onChange({ trigger_type: v })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select trigger…" /></SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectGroup key={g}>
                <SelectLabel className="text-[10px]">{g}</SelectLabel>
                {TRIGGER_TYPES.filter((t) => t.group === g).map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>
      {(config.trigger_type === "appointment_before" || config.trigger_type === "appointment_after") && (
        <div className="space-y-1.5">
          <Label className="text-xs">Days offset</Label>
          <Input
            type="number" min={0} className="h-8 text-xs"
            value={((config.trigger_config ?? {}) as Record<string, number>).days_offset ?? 1}
            onChange={(e) => onChange({ trigger_config: { ...(config.trigger_config ?? {}), days_offset: Number(e.target.value) } })}
          />
        </div>
      )}
    </div>
  )
}

// ─── INSPECTOR: DELAY ────────────────────────────────────────────────────────

function DelayConfigForm({ config, onChange }: { config: DelayConfig; onChange: (u: Partial<DelayConfig>) => void }) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Timing mode</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden border border-border">
          {(["relative", "fixed"] as const).map((m) => (
            <button
              key={m}
              onClick={() => onChange({ mode: m })}
              className={cn(
                "py-1.5 text-xs font-medium transition-colors",
                config.mode === m ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {m === "relative" ? "Relative" : "Fixed date"}
            </button>
          ))}
        </div>
      </div>
      {config.mode === "relative" ? (
        <div className="flex gap-2">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Amount</Label>
            <Input type="number" min={1} className="h-8 text-xs" value={config.amount}
              onChange={(e) => onChange({ amount: Number(e.target.value) })} />
          </div>
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs">Unit</Label>
            <Select value={config.unit} onValueChange={(v) => onChange({ unit: v as DelayConfig["unit"] })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["minutes", "hours", "days", "weeks"].map((u) => (
                  <SelectItem key={u} value={u} className="text-xs capitalize">{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label className="text-xs">Fixed date</Label>
          <Input type="date" className="h-8 text-xs"
            value={config.fixed_date?.slice(0, 10) ?? ""}
            onChange={(e) => onChange({ fixed_date: e.target.value })}
            min={new Date().toISOString().slice(0, 10)} />
        </div>
      )}
      <div className="space-y-1.5">
        <Label className="text-xs">Continue when</Label>
        <Select value={config.condition ?? "immediately"} onValueChange={(v) => onChange({ condition: v as DelayConfig["condition"] })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="immediately" className="text-xs">Always continue</SelectItem>
            <SelectItem value="if_not_completed" className="text-xs">Only if condition not yet met</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── INSPECTOR: CONDITION ─────────────────────────────────────────────────────

function ConditionConfigForm({ config, onChange }: { config: ConditionConfig; onChange: (u: Partial<ConditionConfig>) => void }) {
  type CondRow = (typeof config.conditions)[number]

  function upd(i: number, updates: Partial<CondRow>) {
    onChange({ conditions: config.conditions.map((c, idx) => idx === i ? { ...c, ...updates } : c) })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Match logic</Label>
        <div className="grid grid-cols-2 gap-1 rounded-md overflow-hidden border border-border">
          {(["all", "any"] as const).map((l) => (
            <button
              key={l}
              onClick={() => onChange({ logic: l })}
              className={cn(
                "py-1.5 text-xs font-medium transition-colors",
                config.logic === l ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
              )}
            >
              {l === "all" ? "All match" : "Any match"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {config.conditions.map((cond, i) => (
          <div key={i} className="space-y-1 rounded-lg border border-border/60 p-2 bg-muted/20">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium text-muted-foreground">Condition {i + 1}</p>
              <button onClick={() => onChange({ conditions: config.conditions.filter((_, idx) => idx !== i) })}
                className="text-muted-foreground hover:text-destructive">
                <X className="size-3" />
              </button>
            </div>
            <Select value={cond.field} onValueChange={(v) => upd(i, { field: v })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_FIELDS.map((f) => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={cond.operator} onValueChange={(v) => upd(i, { operator: v as CondRow["operator"] })}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CONDITION_OPERATORS.map((op) => <SelectItem key={op.value} value={op.value} className="text-xs">{op.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {!["is_empty", "is_not_empty"].includes(cond.operator) && (
              <Input className="h-7 text-xs" placeholder="Value…"
                value={cond.value}
                onChange={(e) => upd(i, { value: e.target.value })} />
            )}
          </div>
        ))}
        <Button variant="outline" size="sm" className="w-full h-7 text-xs gap-1"
          onClick={() => onChange({ conditions: [...config.conditions, { field: "project.budget", operator: "equals", value: "" }] })}>
          <Plus className="size-3" /> Add condition
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">On error</Label>
        <Select value={config.on_error} onValueChange={(v) => onChange({ on_error: v as OnError })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="skip" className="text-xs">Skip and continue</SelectItem>
            <SelectItem value="pause" className="text-xs">Pause workflow</SelectItem>
            <SelectItem value="notify" className="text-xs">Notify owner</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── INSPECTOR: ACTION ────────────────────────────────────────────────────────

function ActionConfigForm({ config, onChange }: { config: ActionConfig; onChange: (u: Partial<ActionConfig>) => void }) {
  const ac = config.action_config as Record<string, unknown>
  function setAc(u: Record<string, unknown>) { onChange({ action_config: { ...ac, ...u } }) }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Action type</Label>
        <Select value={config.action_type} onValueChange={(v) => onChange({ action_type: v, action_config: {} })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select action…" /></SelectTrigger>
          <SelectContent>
            {ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value} className="text-xs">{a.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {config.action_type === "send_email" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Send to</Label>
            <Select value={(ac.to as string) ?? "client"} onValueChange={(v) => setAc({ to: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client" className="text-xs">Client</SelectItem>
                <SelectItem value="team_member" className="text-xs">Team member</SelectItem>
                <SelectItem value="custom" className="text-xs">Custom email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {ac.to === "custom" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Email address</Label>
              <Input className="h-8 text-xs" placeholder="email@example.com"
                value={(ac.recipient_email as string) ?? ""} onChange={(e) => setAc({ recipient_email: e.target.value })} />
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs">Subject</Label>
            <Input className="h-8 text-xs" placeholder="e.g. Welcome {{client.name}}!"
              value={(ac.subject as string) ?? ""} onChange={(e) => setAc({ subject: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body</Label>
            <Textarea className="text-xs min-h-[80px] resize-none font-mono" placeholder={"Hi {{client.name}},\n\n..."}
              value={(ac.body_html as string) ?? ""} onChange={(e) => setAc({ body_html: e.target.value })} />
            <p className="text-[9px] text-muted-foreground leading-relaxed">
              Variables: {`{{client.name}}`} {`{{project.name}}`} {`{{invoice.amount}}`} {`{{portal.link}}`}
            </p>
          </div>
        </>
      )}

      {config.action_type === "send_sms" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Send to</Label>
            <Select value={(ac.to as string) ?? "client"} onValueChange={(v) => setAc({ to: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="client" className="text-xs">Client</SelectItem>
                <SelectItem value="team_member" className="text-xs">Team member</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea className="text-xs min-h-[70px] resize-none" placeholder="Hi {{client.name}}, ..."
              value={(ac.message as string) ?? ""} onChange={(e) => setAc({ message: e.target.value })} />
          </div>
        </>
      )}

      {config.action_type === "create_task" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">Task title</Label>
            <Input className="h-8 text-xs" placeholder="e.g. Follow up with {{client.name}}"
              value={(ac.title as string) ?? ""} onChange={(e) => setAc({ title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea className="text-xs min-h-[50px] resize-none" placeholder="Optional details…"
              value={(ac.description as string) ?? ""} onChange={(e) => setAc({ description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Priority</Label>
              <Select value={(ac.priority as string) ?? "MEDIUM"} onValueChange={(v) => setAc({ priority: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["LOW", "MEDIUM", "HIGH", "URGENT"].map((p) => <SelectItem key={p} value={p} className="text-xs">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due (days)</Label>
              <Input type="number" min={0} className="h-8 text-xs" placeholder="e.g. 3"
                value={(ac.due_days_from_now as number) ?? ""}
                onChange={(e) => setAc({ due_days_from_now: Number(e.target.value) })} />
            </div>
          </div>
        </>
      )}

      {config.action_type === "webhook_post" && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs">URL</Label>
            <Input className="h-8 text-xs" placeholder="https://…"
              value={(ac.url as string) ?? ""} onChange={(e) => setAc({ url: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Method</Label>
            <Select value={(ac.method as string) ?? "POST"} onValueChange={(v) => setAc({ method: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="POST" className="text-xs">POST</SelectItem>
                <SelectItem value="PUT" className="text-xs">PUT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body template</Label>
            <Textarea className="text-xs min-h-[80px] resize-none font-mono"
              placeholder={'{\n  "client": "{{client.name}}"\n}'}
              value={(ac.body_template as string) ?? ""} onChange={(e) => setAc({ body_template: e.target.value })} />
          </div>
        </>
      )}

      {(config.action_type === "add_client_tag" || config.action_type === "remove_client_tag") && (
        <div className="space-y-1.5">
          <Label className="text-xs">Tag name</Label>
          <Input className="h-8 text-xs" placeholder="e.g. VIP"
            value={(ac.tag as string) ?? ""} onChange={(e) => setAc({ tag: e.target.value })} />
        </div>
      )}

      {config.action_type === "send_internal_notification" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Message</Label>
          <Textarea className="text-xs min-h-[60px] resize-none" placeholder="Notification text…"
            value={(ac.message as string) ?? ""} onChange={(e) => setAc({ message: e.target.value })} />
        </div>
      )}

      {config.action_type === "move_lead_stage" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Move to stage</Label>
          <Select value={(ac.stage as string) ?? ""} onValueChange={(v) => setAc({ stage: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select stage…" /></SelectTrigger>
            <SelectContent>
              {["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">{s.toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {config.action_type === "change_project_status" && (
        <div className="space-y-1.5">
          <Label className="text-xs">New status</Label>
          <Select value={(ac.status as string) ?? ""} onValueChange={(v) => setAc({ status: v })}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select status…" /></SelectTrigger>
            <SelectContent>
              {["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"].map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Separator />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium">Require approval</p>
          <p className="text-[10px] text-muted-foreground">Notify me before this fires</p>
        </div>
        <Switch checked={config.require_approval} onCheckedChange={(v) => onChange({ require_approval: v })} className="scale-90" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">On error</Label>
        <Select value={config.on_error} onValueChange={(v) => onChange({ on_error: v as OnError })}>
          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="skip" className="text-xs">Skip and continue</SelectItem>
            <SelectItem value="pause" className="text-xs">Pause workflow</SelectItem>
            <SelectItem value="notify" className="text-xs">Notify owner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* AI suggestions stub */}
      <div className="rounded-lg bg-muted/40 border border-border/50 p-3 mt-1">
        <p className="text-[10px] font-semibold flex items-center gap-1.5 mb-1">
          <Sparkles className="size-3 text-primary" /> AI suggestions
        </p>
        <p className="text-[10px] text-muted-foreground">Save the workflow to get AI-powered next-step recommendations.</p>
      </div>
    </div>
  )
}

// ─── INSPECTOR ────────────────────────────────────────────────────────────────

function Inspector({
  node, runs, onUpdateConfig, onClose,
}: {
  node: AutomationNode; runs: Run[]
  onUpdateConfig: (nodeId: string, config: Partial<Record<string, unknown>>) => void
  onClose: () => void
}) {
  const runStatusColor: Record<string, string> = {
    SUCCESS: "bg-green-500", COMPLETED: "bg-green-500",
    FAILURE: "bg-red-500", FAILED: "bg-red-500",
    SKIPPED: "bg-yellow-400", RUNNING: "bg-blue-500", DRY_RUN: "bg-purple-400",
  }
  const stepStatusIcon: Record<string, React.ElementType> = {
    COMPLETED: CheckCircle2, FAILED: XCircle, SKIPPED: SkipForward,
    RUNNING: Loader2, PENDING: Clock, AWAITING_APPROVAL: AlertCircle,
  }

  return (
    <aside className="w-[264px] shrink-0 border-l border-border flex flex-col bg-background overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
        <div>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {node.type.toUpperCase()}
          </p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded p-0.5 hover:bg-muted">
          <X className="size-3.5" />
        </button>
      </div>

      <Tabs defaultValue="configure" className="flex flex-col flex-1 overflow-hidden">
        <div className="px-3 pt-2 pb-0 shrink-0">
          <TabsList className="w-full h-7 bg-muted/50 text-xs">
            <TabsTrigger value="configure" className="flex-1 text-xs h-5">Configure</TabsTrigger>
            <TabsTrigger value="runlog" className="flex-1 text-xs h-5">Run log</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="configure" className="flex-1 overflow-y-auto px-4 py-3 mt-0">
          {node.type === "trigger" && (
            <TriggerConfigForm config={node.config as TriggerConfig}
              onChange={(u) => onUpdateConfig(node.id, u)} />
          )}
          {node.type === "delay" && (
            <DelayConfigForm config={node.config as DelayConfig}
              onChange={(u) => onUpdateConfig(node.id, u)} />
          )}
          {node.type === "condition" && (
            <ConditionConfigForm config={node.config as ConditionConfig}
              onChange={(u) => onUpdateConfig(node.id, u)} />
          )}
          {node.type === "action" && (
            <ActionConfigForm config={node.config as ActionConfig}
              onChange={(u) => onUpdateConfig(node.id, u)} />
          )}
        </TabsContent>

        <TabsContent value="runlog" className="flex-1 overflow-y-auto px-3 py-3 mt-0">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Play className="size-8 text-muted-foreground/20 mb-2" />
              <p className="text-xs font-medium text-muted-foreground">No runs yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Use Test run to simulate</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Recent runs</p>
              {runs.slice(0, 10).map((run) => {
                const color = runStatusColor[run.status] ?? "bg-muted-foreground"
                const steps = run.steps.filter((s) => s.nodeId === node.id)
                return (
                  <details key={run.id} className="rounded-lg border border-border text-xs group">
                    <summary className="flex items-center gap-2 px-2.5 py-2 cursor-pointer hover:bg-muted/30 rounded-lg list-none">
                      <span className={cn("size-1.5 rounded-full shrink-0", color)} />
                      <span className="flex-1 truncate text-muted-foreground text-[10px]">
                        {formatDistanceToNow(new Date(run.ranAt), { addSuffix: true })}
                      </span>
                      {run.dryRun && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Test</Badge>}
                    </summary>
                    {steps.length > 0 && (
                      <div className="px-2.5 pb-2 pt-1 border-t border-border space-y-1">
                        {steps.map((step) => {
                          const SIcon = stepStatusIcon[step.status] ?? CircleDot
                          return (
                            <div key={step.id} className="flex items-start gap-1.5">
                              <SIcon className="size-3 mt-0.5 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-medium">{step.status}</p>
                                {step.error && <p className="text-[10px] text-destructive truncate">{step.error}</p>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </details>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  )
}

// ─── MAIN BUILDER ─────────────────────────────────────────────────────────────

export function BuilderClient({ automation }: { automation: BuilderAutomation }) {
  const [graph, setGraph] = React.useState<AutomationGraph>(() => parseGraph(automation.nodes))
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>("trigger")
  const [automationName, setAutomationName] = React.useState(automation.name)
  const [editingName, setEditingName] = React.useState(false)
  const [isEnabled, setIsEnabled] = React.useState(automation.isActive)
  const [saving, setSaving] = React.useState(false)
  const [isDirty, setIsDirty] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [activePaletteItem, setActivePaletteItem] = React.useState<{ type: AutomationNodeType; actionType?: string } | null>(null)
  const [dragOverTarget, setDragOverTarget] = React.useState<string | null>(null)
  const autoSaveRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  // Escape dismisses palette selection
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") setActivePaletteItem(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Auto-save every 30 s when dirty
  React.useEffect(() => {
    if (!isDirty) return
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => { handleSave(true) }, 30_000)
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, graph, automationName, isEnabled])

  // ─── Graph ops ──────────────────────────────────────────────────────────────

  function handleInsertNode(afterId: string, type: AutomationNodeType, branch?: "yes" | "no", actionType?: string) {
    const id = makeNodeId()
    setGraph((prev) => {
      const target = prev.nodes.find((n) => n.id === afterId)
      if (!target) return prev
      const existingNext =
        branch && target.type === "condition" ? (target.branches?.[branch] ?? null) : (target.next ?? null)
      const newNode: AutomationNode = {
        id, type,
        config: getDefaultConfig(type, actionType) as unknown as AutomationNode["config"],
        next: existingNext,
        ...(type === "condition" ? { branches: { yes: null, no: null } } : {}),
      }
      const updatedNodes = prev.nodes.map((n) => {
        if (n.id !== afterId) return n
        if (branch && n.type === "condition") return { ...n, branches: { ...n.branches, [branch]: id } }
        return { ...n, next: id }
      })
      return { nodes: [...updatedNodes, newNode] }
    })
    setSelectedNodeId(id)
    setActivePaletteItem(null)
    setIsDirty(true)
  }

  function handleDeleteNode(nodeId: string) {
    if (nodeId === "trigger") return
    setGraph((prev) => {
      const target = prev.nodes.find((n) => n.id === nodeId)
      if (!target) return prev
      return {
        nodes: prev.nodes
          .filter((n) => n.id !== nodeId)
          .map((n) => {
            if (n.next === nodeId) return { ...n, next: target.next ?? null }
            if (n.branches?.yes === nodeId) return { ...n, branches: { ...n.branches, yes: target.next ?? null } }
            if (n.branches?.no === nodeId) return { ...n, branches: { ...n.branches, no: target.next ?? null } }
            return n
          }),
      }
    })
    setSelectedNodeId(null)
    setIsDirty(true)
  }

  function handleUpdateConfig(nodeId: string, updates: Partial<Record<string, unknown>>) {
    setGraph((prev) => ({
      nodes: prev.nodes.map((n) => n.id === nodeId ? { ...n, config: { ...n.config, ...updates } } : n),
    }))
    setIsDirty(true)
  }

  // ─── Save ────────────────────────────────────────────────────────────────────

  async function handleSave(silent = false) {
    if (saving) return
    setSaving(true)
    const triggerNode = graph.nodes.find((n) => n.id === "trigger")
    const triggerType = (triggerNode?.config as TriggerConfig)?.trigger_type ?? automation.triggerType
    const result = await saveBuilderAutomation(automation.id, { name: automationName, triggerType, nodes: graph, isActive: isEnabled })
    setSaving(false)
    if (result.success) {
      setIsDirty(false)
      setLastSaved(new Date())
      if (!silent) toast.success("Workflow saved")
    } else {
      toast.error("Failed to save")
    }
  }

  // ─── Drag handlers ───────────────────────────────────────────────────────────

  function handlePaletteDragStart(e: React.DragEvent, type: AutomationNodeType, actionType?: string) {
    e.dataTransfer.setData("nodeType", type)
    if (actionType) e.dataTransfer.setData("actionType", actionType)
    setActivePaletteItem({ type, actionType })
  }

  function handlePaletteClickItem(type: AutomationNodeType, actionType?: string) {
    const same = activePaletteItem?.type === type && activePaletteItem?.actionType === actionType
    setActivePaletteItem(same ? null : { type, actionType })
  }

  function handleCanvasDrop(e: React.DragEvent, afterId: string, branch?: "yes" | "no") {
    e.preventDefault()
    setDragOverTarget(null)
    const type = e.dataTransfer.getData("nodeType") as AutomationNodeType
    const actionType = e.dataTransfer.getData("actionType") || undefined
    if (type) handleInsertNode(afterId, type, branch, actionType)
  }

  const selectedNode = selectedNodeId ? graph.nodes.find((n) => n.id === selectedNodeId) ?? null : null
  const activePaletteKey = activePaletteItem ? `${activePaletteItem.type}:${activePaletteItem.actionType ?? ""}` : null

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      {/* ── Topbar ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7 shrink-0 text-muted-foreground" asChild>
          <Link href="/automations"><ArrowLeft className="size-3" /> Automations</Link>
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />

        {editingName ? (
          <Input
            autoFocus
            value={automationName}
            onChange={(e) => { setAutomationName(e.target.value); setIsDirty(true) }}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false) }}
            className="h-7 text-sm font-semibold w-64 border-primary"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-semibold hover:text-primary transition-colors truncate max-w-72 text-left"
            title="Click to rename"
          >
            {automationName}
          </button>
        )}

        <div className="flex-1" />

        {isDirty ? (
          <span className="text-[10px] text-muted-foreground hidden sm:block">Unsaved changes</span>
        ) : lastSaved ? (
          <span className="text-[10px] text-muted-foreground hidden sm:block">
            Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
          </span>
        ) : null}

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Enabled</span>
          <Switch checked={isEnabled} onCheckedChange={(v) => { setIsEnabled(v); setIsDirty(true) }} className="scale-90" />
        </div>

        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Play className="size-3" /> Test run
        </Button>

        <Button size="sm" className="h-7 text-xs gap-1.5" onClick={() => handleSave()} disabled={saving}>
          {saving ? <Loader2 className="size-3 animate-spin" /> : <Save className="size-3" />}
          Save
        </Button>
      </div>

      {/* ── Three-column layout ── */}
      <div className="flex flex-1 overflow-hidden">
        <Palette
          onDragStart={handlePaletteDragStart}
          onClickItem={handlePaletteClickItem}
          activeItemKey={activePaletteKey}
        />

        <main
          className="flex-1 overflow-auto bg-[repeating-linear-gradient(0deg,transparent,transparent_31px,hsl(var(--border)/0.3)_31px,hsl(var(--border)/0.3)_32px),repeating-linear-gradient(90deg,transparent,transparent_31px,hsl(var(--border)/0.3)_31px,hsl(var(--border)/0.3)_32px)]"
          onClick={() => activePaletteItem && setActivePaletteItem(null)}
        >
          <CanvasFlow
            graph={graph}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => setSelectedNodeId(id)}
            onInsert={handleInsertNode}
            onDelete={handleDeleteNode}
            activePaletteItem={activePaletteItem}
            dragOverTarget={dragOverTarget}
            onDragOver={(e, key) => { e.preventDefault(); setDragOverTarget(key) }}
            onDragLeave={() => setDragOverTarget(null)}
            onDrop={handleCanvasDrop}
          />
        </main>

        {selectedNode && (
          <Inspector
            node={selectedNode}
            runs={automation.runs}
            onUpdateConfig={handleUpdateConfig}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </div>
    </div>
  )
}
