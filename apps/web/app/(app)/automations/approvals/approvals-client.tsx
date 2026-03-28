"use client"

import * as React from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, Zap,
  CheckCheck, X, ShieldCheck, History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"
import { approveAutomationStep, rejectAutomationStep } from "./actions"
import type { AutomationGraph, AutomationNode, ActionConfig } from "@/lib/automation-types"

// ─── Types ───────────────────────────────────────────────────────────────────

type Approver = { name: string | null; email: string } | null
type RunInfo = {
  id: string
  entityType: string | null
  entityId?: string | null
  automation: { id: string; name: string; nodes?: unknown }
}
type HistoryRunInfo = {
  id: string
  entityType: string | null
  automation: { id: string; name: string }
}

type PendingApproval = {
  id: string
  runId: string
  nodeId: string
  requestedAt: Date | string
  status: string
  run: RunInfo
  approver: Approver
}

type HistoryApproval = {
  id: string
  runId: string
  nodeId: string
  requestedAt: Date | string
  approvedAt: Date | string | null
  status: string
  run: HistoryRunInfo
  approver: Approver
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPausedNodeInfo(nodes: unknown, nodeId: string): { label: string; actionType: string } | null {
  if (!nodes || typeof nodes !== "object" || !("nodes" in (nodes as object))) return null
  const graph = nodes as AutomationGraph
  const node = graph.nodes.find((n: AutomationNode) => n.id === nodeId)
  if (!node || node.type !== "action") return null
  const cfg = node.config as ActionConfig
  return {
    label: cfg.action_type?.replace(/_/g, " ") ?? "action",
    actionType: cfg.action_type ?? "",
  }
}

// ─── Pending card ─────────────────────────────────────────────────────────────

function PendingCard({ approval, onAction }: {
  approval: PendingApproval
  onAction: (id: string, action: "approve" | "reject") => void
}) {
  const [loading, setLoading] = React.useState<"approve" | "reject" | null>(null)
  const pauseInfo = getPausedNodeInfo(approval.run.automation.nodes, approval.nodeId)

  async function handle(action: "approve" | "reject") {
    setLoading(action)
    onAction(approval.id, action)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
            <Clock className="size-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">{approval.run.automation.name}</p>
              <Badge variant="outline" className="text-[10px] border-yellow-400/50 text-yellow-600 dark:text-yellow-400">
                Awaiting approval
              </Badge>
            </div>
            {pauseInfo && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Paused before: <span className="text-foreground capitalize">{pauseInfo.label}</span>
              </p>
            )}
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground shrink-0 mt-1">
          {formatDistanceToNow(new Date(approval.requestedAt), { addSuffix: true })}
        </span>
      </div>

      {/* Context */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground pl-10">
        {approval.run.entityType && (
          <span className="capitalize">
            Entity: <span className="text-foreground">{approval.run.entityType}</span>
          </span>
        )}
        <span>
          Run:{" "}
          <Link
            href={`/automations/${approval.run.automation.id}/builder`}
            className="text-primary hover:underline"
          >
            view builder
          </Link>
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pl-10">
        <Button
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => handle("approve")}
          disabled={loading !== null}
        >
          <CheckCheck className="size-3.5" />
          {loading === "approve" ? "Approving…" : "Approve & Continue"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={() => handle("reject")}
          disabled={loading !== null}
        >
          <X className="size-3.5" />
          {loading === "reject" ? "Rejecting…" : "Reject"}
        </Button>
      </div>
    </div>
  )
}

// ─── History row ──────────────────────────────────────────────────────────────

function HistoryRow({ approval }: { approval: HistoryApproval }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      {approval.status === "APPROVED"
        ? <CheckCircle2 className="size-4 text-green-500 shrink-0" />
        : <XCircle className="size-4 text-red-500 shrink-0" />
      }
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{approval.run.automation.name}</p>
        {approval.run.entityType && (
          <p className="text-[10px] text-muted-foreground capitalize">{approval.run.entityType}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={cn(
          "text-[10px] font-medium",
          approval.status === "APPROVED"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        )}>
          {approval.status === "APPROVED" ? "Approved" : "Rejected"}
          {approval.approver?.name ? ` by ${approval.approver.name}` : ""}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {approval.approvedAt
            ? format(new Date(approval.approvedAt), "MMM d, HH:mm")
            : "—"
          }
        </p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function ApprovalsClient({
  pending: initialPending,
  history,
}: {
  pending: PendingApproval[]
  history: HistoryApproval[]
}) {
  const [pending, setPending] = React.useState(initialPending)
  const [tab, setTab] = React.useState<"pending" | "history">("pending")

  async function handleAction(approvalId: string, action: "approve" | "reject") {
    const fn = action === "approve" ? approveAutomationStep : rejectAutomationStep
    const result = await fn(approvalId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(action === "approve" ? "Step approved — automation resumed" : "Step rejected")
      setPending((prev) => prev.filter((a) => a.id !== approvalId))
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/automations">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-primary" />
              Approval Inbox
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automations paused waiting for your sign-off
            </p>
          </div>
        </div>
        {pending.length > 0 && (
          <Badge className="text-xs">{pending.length} pending</Badge>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border shrink-0">
        <button
          onClick={() => setTab("pending")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            tab === "pending"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Clock className="size-3.5" />
          Pending
          {pending.length > 0 && (
            <span className={cn(
              "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              tab === "pending" ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
            )}>
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("history")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
            tab === "history"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <History className="size-3.5" />
          History
        </button>
      </div>

      <ScrollArea className="flex-1">
        {tab === "pending" ? (
          pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <CheckCircle2 className="size-10 text-green-500/30 mb-3" />
              <p className="text-sm font-medium">All clear!</p>
              <p className="text-xs text-muted-foreground mt-1">
                No automations are waiting for approval
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-3">
              {pending.map((approval) => (
                <PendingCard
                  key={approval.id}
                  approval={approval}
                  onAction={handleAction}
                />
              ))}
            </div>
          )
        ) : (
          history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <History className="size-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">No history yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Approved and rejected steps will appear here
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border mx-6 mt-6 divide-y divide-border overflow-hidden">
              {history.map((approval) => (
                <HistoryRow key={approval.id} approval={approval} />
              ))}
            </div>
          )
        )}
      </ScrollArea>
    </div>
  )
}
