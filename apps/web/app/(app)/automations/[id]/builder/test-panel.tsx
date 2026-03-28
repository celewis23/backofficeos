"use client"

import * as React from "react"
import {
  Play, Loader2, CheckCircle2, Clock, XCircle, GitBranch,
  Zap, CircleDot, ChevronRight, AlertCircle, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { AutomationNodeType } from "@/lib/automation-types"

// ─── Types ────────────────────────────────────────────────────────────────────

type Entity = { id: string; label: string }

type TraceStep = {
  nodeId: string
  nodeType: AutomationNodeType
  title: string
  status: "completed" | "skipped" | "waiting"
  description: string
  branchTaken?: "yes" | "no"
  conditionResult?: boolean
}

// ─── Node type icons + colors ─────────────────────────────────────────────────

const NODE_ICONS: Record<AutomationNodeType, React.ElementType> = {
  trigger: Zap,
  delay: Clock,
  condition: GitBranch,
  action: CircleDot,
}

const NODE_COLORS: Record<AutomationNodeType, string> = {
  trigger: "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
  delay: "text-muted-foreground bg-muted/50",
  condition: "text-green-600 bg-green-50 dark:bg-green-950/30",
  action: "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
}

const STATUS_ICON: Record<TraceStep["status"], React.ElementType> = {
  completed: CheckCircle2,
  waiting: Clock,
  skipped: XCircle,
}

const STATUS_COLOR: Record<TraceStep["status"], string> = {
  completed: "text-green-500",
  waiting: "text-amber-500",
  skipped: "text-muted-foreground",
}

// ─── TestPanel ────────────────────────────────────────────────────────────────

interface TestPanelProps {
  open: boolean
  onClose: () => void
  automationId: string
}

export function TestPanel({ open, onClose, automationId }: TestPanelProps) {
  const [entityType, setEntityType] = React.useState<string>("")
  const [entities, setEntities] = React.useState<Entity[]>([])
  const [selectedEntityId, setSelectedEntityId] = React.useState<string>("")
  const [loadingEntities, setLoadingEntities] = React.useState(false)
  const [running, setRunning] = React.useState(false)
  const [trace, setTrace] = React.useState<TraceStep[] | null>(null)
  const [runId, setRunId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  // Load entities when panel opens
  React.useEffect(() => {
    if (!open) return
    setTrace(null)
    setRunId(null)
    setError(null)
    setSelectedEntityId("")
    setLoadingEntities(true)
    fetch(`/api/automations/${automationId}/test-entities`)
      .then((r) => r.json())
      .then(({ entityType: et, entities: list }) => {
        setEntityType(et ?? "none")
        setEntities(list ?? [])
      })
      .catch(() => setEntityType("none"))
      .finally(() => setLoadingEntities(false))
  }, [open, automationId])

  async function handleRun() {
    setRunning(true)
    setTrace(null)
    setError(null)
    setRunId(null)
    try {
      const body: Record<string, string> = {}
      if (selectedEntityId && entityType !== "none") {
        body.entityType = entityType
        body.entityId = selectedEntityId
      }
      const res = await fetch(`/api/automations/${automationId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Simulation failed")
      } else {
        setTrace(data.trace)
        setRunId(data.runId)
      }
    } catch {
      setError("Network error — could not reach server")
    } finally {
      setRunning(false)
    }
  }

  const canRun = entityType === "none" || !loadingEntities

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-semibold flex items-center gap-2">
              <Play className="size-3.5 text-primary" />
              Test Run (Dry Run)
            </SheetTitle>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Simulates the workflow without sending emails or modifying data.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-5 py-4 space-y-5">
            {/* Entity selector */}
            {entityType && entityType !== "none" && (
              <div className="space-y-2">
                <p className="text-xs font-medium">
                  Test against a real {entityType}{" "}
                  <span className="text-muted-foreground font-normal">(optional)</span>
                </p>
                {loadingEntities ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" /> Loading {entityType}s…
                  </div>
                ) : entities.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No {entityType}s found — will use sample context.</p>
                ) : (
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder={`Select a ${entityType}…`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sample context (no real entity)</SelectItem>
                      {entities.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Run button */}
            <Button
              className="w-full gap-2"
              onClick={handleRun}
              disabled={running || !canRun}
            >
              {running ? (
                <><Loader2 className="size-3.5 animate-spin" /> Simulating…</>
              ) : (
                <><Play className="size-3.5" /> Run Simulation</>
              )}
            </Button>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs text-destructive">
                <AlertCircle className="size-3.5 mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            {/* Results */}
            {trace && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">Simulation trace</p>
                    {runId && (
                      <Badge variant="secondary" className="text-[9px] font-mono">
                        run:{runId.slice(-6)}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-0">
                    {trace.map((step, i) => {
                      const NodeIcon = NODE_ICONS[step.nodeType]
                      const StatusIcon = STATUS_ICON[step.status]
                      const isLast = i === trace.length - 1

                      return (
                        <div key={step.nodeId} className="flex gap-3">
                          {/* Connector line */}
                          <div className="flex flex-col items-center shrink-0">
                            <div className={cn(
                              "size-7 rounded-full flex items-center justify-center shrink-0",
                              NODE_COLORS[step.nodeType]
                            )}>
                              <NodeIcon className="size-3.5" />
                            </div>
                            {!isLast && <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[12px]" />}
                          </div>

                          {/* Content */}
                          <div className={cn("flex-1 pb-4", isLast && "pb-0")}>
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <span className="text-xs font-medium leading-snug">{step.title}</span>
                              <StatusIcon className={cn("size-3.5 shrink-0 mt-0.5", STATUS_COLOR[step.status])} />
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">{step.description}</p>
                            {step.nodeType === "condition" && step.branchTaken && (
                              <div className="flex items-center gap-1 mt-1">
                                <ChevronRight className="size-3 text-muted-foreground" />
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  step.branchTaken === "yes" ? "text-green-600" : "text-red-500"
                                )}>
                                  Branch: {step.branchTaken === "yes" ? "YES ✓" : "NO ✗"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Summary */}
                  <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-xs space-y-1">
                    <p className="font-medium">Summary</p>
                    <div className="flex gap-4 text-muted-foreground">
                      <span>{trace.length} step{trace.length !== 1 ? "s" : ""} traced</span>
                      <span>{trace.filter((s) => s.status === "completed").length} completed</span>
                      {trace.filter((s) => s.status === "waiting").length > 0 && (
                        <span>{trace.filter((s) => s.status === "waiting").length} delayed</span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
