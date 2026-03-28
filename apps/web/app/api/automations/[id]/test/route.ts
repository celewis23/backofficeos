import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import type {
  AutomationGraph, AutomationNode, AutomationNodeType,
  TriggerConfig, DelayConfig, ConditionConfig, ActionConfig, ConditionRule,
} from "@/lib/automation-types"
import { nodeTitle } from "@/lib/automation-types"

// ─── Entity context ──────────────────────────────────────────────────────────

type EntityContext = {
  client?:  { name: string; email?: string; company?: string; tags?: string[]; status?: string; industry?: string }
  project?: { name: string; status: string; budget?: number }
  invoice?: { number: string; amount: number; status: string; dueDate?: string }
  contract?:{ name: string; status: string }
  lead?:    { name: string; value?: number; source?: string; stage: string }
  booking?: { date?: string; duration?: number }
  task?:    { title: string; status: string }
  org?:     { name: string; email?: string }
  time_since_trigger_days?: number
}

async function buildContext(
  entityType: string,
  entityId: string,
  orgId: string
): Promise<EntityContext> {
  const org = await db.organization.findUnique({ where: { id: orgId }, select: { name: true, email: true } })
  const ctx: EntityContext = { org: { name: org?.name ?? "", email: org?.email ?? undefined } }

  switch (entityType) {
    case "invoice": {
      const row = await db.invoice.findFirst({
        where: { id: entityId, organizationId: orgId },
        include: { client: { select: { name: true, email: true } } },
      })
      if (row) {
        ctx.invoice = { number: row.number, amount: Number(row.total), status: row.status, dueDate: row.dueDate?.toISOString() }
        if (row.client) ctx.client = { name: row.client.name, email: row.client.email ?? undefined }
      }
      break
    }
    case "contract": {
      const row = await db.contract.findFirst({
        where: { id: entityId, organizationId: orgId },
        include: { client: { select: { name: true, email: true } } },
      })
      if (row) {
        ctx.contract = { name: row.title, status: row.status }
        if (row.client) ctx.client = { name: row.client.name, email: row.client.email ?? undefined }
      }
      break
    }
    case "lead": {
      const row = await db.lead.findFirst({ where: { id: entityId, organizationId: orgId } })
      if (row) ctx.lead = { name: row.name, value: row.value ? Number(row.value) : undefined, source: row.source ?? undefined, stage: row.stage ?? "unknown" }
      break
    }
    case "client": {
      const row = await db.client.findFirst({ where: { id: entityId, organizationId: orgId } })
      if (row) ctx.client = { name: row.name, email: row.email ?? undefined, status: row.status, tags: [], industry: row.industry ?? undefined }
      break
    }
    case "project": {
      const row = await db.project.findFirst({
        where: { id: entityId, organizationId: orgId },
        include: { client: { select: { name: true, email: true } } },
      })
      if (row) {
        ctx.project = { name: row.name, status: row.status, budget: row.budget ? Number(row.budget) : undefined }
        if (row.client) ctx.client = { name: row.client.name, email: row.client.email ?? undefined }
      }
      break
    }
    case "task": {
      const row = await db.task.findFirst({ where: { id: entityId, organizationId: orgId } })
      if (row) ctx.task = { title: row.title, status: row.status }
      break
    }
  }

  ctx.time_since_trigger_days = 0
  return ctx
}

// ─── Condition evaluator ─────────────────────────────────────────────────────

function getNestedValue(ctx: EntityContext, field: string): unknown {
  if (field === "time_since_trigger_days") return ctx.time_since_trigger_days ?? 0
  const parts = field.split(".")
  let val: unknown = ctx
  for (const part of parts) {
    if (val == null || typeof val !== "object") return undefined
    val = (val as Record<string, unknown>)[part]
  }
  return val
}

function evalRule(rule: ConditionRule, ctx: EntityContext): boolean {
  const val = getNestedValue(ctx, rule.field)
  const strVal = String(val ?? "")
  const numVal = Number(val ?? 0)
  const target = rule.value

  switch (rule.operator) {
    case "equals":       return strVal === target || (Array.isArray(val) && val.includes(target))
    case "not_equals":   return strVal !== target
    case "greater_than": return numVal > Number(target)
    case "less_than":    return numVal < Number(target)
    case "contains":     return Array.isArray(val) ? val.includes(target) : strVal.toLowerCase().includes(target.toLowerCase())
    case "not_contains": return Array.isArray(val) ? !val.includes(target) : !strVal.toLowerCase().includes(target.toLowerCase())
    case "is_empty":     return val == null || strVal === "" || (Array.isArray(val) && val.length === 0)
    case "is_not_empty": return val != null && strVal !== "" && !(Array.isArray(val) && val.length === 0)
    default:             return true
  }
}

function evalCondition(cfg: ConditionConfig, ctx: EntityContext): boolean {
  if (!cfg.conditions?.length) return true
  const results = cfg.conditions.map((r) => evalRule(r, ctx))
  return cfg.logic === "all" ? results.every(Boolean) : results.some(Boolean)
}

// ─── Variable interpolation ──────────────────────────────────────────────────

function interpolate(template: string, ctx: EntityContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const trimmed = key.trim()
    const val = getNestedValue(ctx, trimmed)
    return val != null ? String(val) : `{{${trimmed}}}`
  })
}

// ─── Action description ──────────────────────────────────────────────────────

function describeAction(cfg: ActionConfig, ctx: EntityContext): string {
  const ac = cfg.action_config as Record<string, unknown>
  switch (cfg.action_type) {
    case "send_email":     return `Send email to ${ac.to ?? "client"}: "${interpolate(String(ac.subject ?? "(no subject)"), ctx)}"`
    case "send_sms":       return `Send SMS to ${ac.to ?? "client"}: "${interpolate(String(ac.message ?? ""), ctx).slice(0, 60)}..."`
    case "send_form":      return `Send intake form (ID: ${ac.form_id ?? "?"})`
    case "send_contract":  return `Send contract template`
    case "send_invoice":   return `Send invoice from template`
    case "send_scheduler": return `Send scheduling link`
    case "create_task":    return `Create task: "${interpolate(String(ac.title ?? "Untitled"), ctx)}"${ac.due_days_from_now ? ` (due in ${ac.due_days_from_now} days)` : ""}`
    case "change_project_status": return `Change project status to ${ac.status}`
    case "move_lead_stage":       return `Move lead to stage: ${ac.stage}`
    case "add_client_tag":        return `Add tag "${ac.tag}" to client`
    case "remove_client_tag":     return `Remove tag "${ac.tag}" from client`
    case "activate_portal":       return `${ac.activate ? "Activate" : "Deactivate"} client portal`
    case "archive_project":       return `Archive project`
    case "apply_workflow":        return `Trigger child workflow`
    case "pause_workflow":        return `Pause workflow here (awaits manual resume)`
    case "send_internal_notification": return `Notify team: "${interpolate(String(ac.message ?? ""), ctx).slice(0, 60)}"`
    case "post_slack":     return `Post Slack message to #${ac.channel_id ?? "channel"}`
    case "webhook_post":   return `POST to ${ac.url ?? "?"}`
    default:               return `Execute: ${cfg.action_type.replace(/_/g, " ")}`
  }
}

// ─── Trace step ──────────────────────────────────────────────────────────────

export type TraceStep = {
  nodeId: string
  nodeType: AutomationNodeType
  title: string
  status: "completed" | "skipped" | "waiting"
  description: string
  branchTaken?: "yes" | "no"
  conditionResult?: boolean
}

// ─── Graph walker ────────────────────────────────────────────────────────────

async function walkGraph(
  graph: AutomationGraph,
  ctx: EntityContext
): Promise<{ trace: TraceStep[]; branchPath: Record<string, "yes" | "no"> }> {
  const trace: TraceStep[] = []
  const branchPath: Record<string, "yes" | "no"> = {}
  const visited = new Set<string>()

  async function walk(nodeId: string | null | undefined) {
    if (!nodeId || visited.has(nodeId)) return
    visited.add(nodeId)

    const node = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return

    switch (node.type) {
      case "trigger": {
        const cfg = node.config as TriggerConfig
        trace.push({ nodeId: node.id, nodeType: "trigger", title: nodeTitle(node), status: "completed", description: `Trigger fired: ${cfg.trigger_type.replace(/_/g, " ")}` })
        await walk(node.next)
        break
      }
      case "delay": {
        const cfg = node.config as DelayConfig
        const desc = cfg.mode === "fixed"
          ? `Would wait until ${cfg.fixed_date ? new Date(cfg.fixed_date).toLocaleDateString() : "fixed date"}`
          : `Would wait ${cfg.amount} ${cfg.unit}`
        trace.push({ nodeId: node.id, nodeType: "delay", title: nodeTitle(node), status: "waiting", description: desc })
        await walk(node.next)
        break
      }
      case "condition": {
        const cfg = node.config as ConditionConfig
        const result = evalCondition(cfg, ctx)
        const taken: "yes" | "no" = result ? "yes" : "no"
        branchPath[node.id] = taken
        trace.push({
          nodeId: node.id, nodeType: "condition", title: nodeTitle(node),
          status: "completed",
          description: `Condition evaluated → ${result ? "YES ✓" : "NO ✗"}  (logic: ${cfg.logic}, ${cfg.conditions.length} rule${cfg.conditions.length !== 1 ? "s" : ""})`,
          branchTaken: taken, conditionResult: result,
        })
        // Walk the taken branch
        const branchStart = taken === "yes" ? node.branches?.yes : node.branches?.no
        await walk(branchStart)
        // If there's a node after the condition (merge), walk it too
        if (node.next) await walk(node.next)
        break
      }
      case "action": {
        const cfg = node.config as ActionConfig
        const desc = describeAction(cfg, ctx)
        trace.push({
          nodeId: node.id, nodeType: "action", title: nodeTitle(node), status: "completed",
          description: `[DRY RUN] ${desc}${cfg.require_approval ? " — ⏸ Would await approval first" : ""}`,
        })
        await walk(node.next)
        break
      }
    }
  }

  await walk("trigger")
  return { trace, branchPath }
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireOrg()

    const automation = await db.automation.findFirst({ where: { id, organizationId: orgId } })
    if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const body = await req.json() as { entityType?: string; entityId?: string }

    // Parse graph
    const rawNodes = automation.nodes
    let graph: AutomationGraph
    if (rawNodes && typeof rawNodes === "object" && "nodes" in (rawNodes as object) && Array.isArray((rawNodes as unknown as AutomationGraph).nodes)) {
      graph = rawNodes as unknown as AutomationGraph
    } else {
      return NextResponse.json({ error: "No visual graph found. Save the automation in the builder first." }, { status: 400 })
    }

    // Build context
    const ctx = body.entityId && body.entityType
      ? await buildContext(body.entityType, body.entityId, orgId)
      : { org: { name: "Sample Org" }, time_since_trigger_days: 0 }

    // Walk the graph
    const { trace, branchPath } = await walkGraph(graph, ctx)

    // Persist the run
    const run = await db.automationRun.create({
      data: {
        automationId: id,
        organizationId: orgId,
        clientId: null,
        status: "DRY_RUN",
        entityType: body.entityType ?? null,
        entityId: body.entityId ?? null,
        branchPath: JSON.parse(JSON.stringify(branchPath)),
        dryRun: true,
        ranAt: new Date(),
        completedAt: new Date(),
      },
    })

    // Persist steps
    await db.automationRunStep.createMany({
      data: trace.map((step, i) => ({
        runId: run.id,
        nodeId: step.nodeId,
        nodeType: step.nodeType,
        status: step.status === "completed" ? "COMPLETED" : step.status === "waiting" ? "PENDING" : "COMPLETED",
        outputData: JSON.parse(JSON.stringify({ description: step.description, branchTaken: step.branchTaken })),
        executedAt: new Date(),
      })),
    })

    // Update run count
    await db.automation.update({ where: { id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } })

    return NextResponse.json({ success: true, runId: run.id, trace, context: ctx })
  } catch (e) {
    console.error("Dry-run error:", e)
    return NextResponse.json({ error: "Simulation failed" }, { status: 500 })
  }
}
