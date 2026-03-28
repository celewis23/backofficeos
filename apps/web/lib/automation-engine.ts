/**
 * automation-engine.ts
 * Real execution engine for visual automation graphs.
 * Called from server actions — never used client-side.
 */

import { db } from "@backoffice-os/database"
import { resend } from "@backoffice-os/email"
import { createNotification } from "./notifications"
import type {
  AutomationGraph, AutomationNode, ActionConfig,
  ConditionConfig, DelayConfig, ConditionRule,
} from "./automation-types"
import type { ProjectStatus } from "@backoffice-os/database"

// ─── Entity context ───────────────────────────────────────────────────────────

type EntityContext = {
  client?:  { name: string; email?: string; company?: string; status?: string; industry?: string }
  project?: { name: string; status: string; budget?: number }
  invoice?: { number: string; amount: number; status: string; dueDate?: string }
  contract?:{ name: string; status: string }
  lead?:    { name: string; value?: number; source?: string; stage: string; email?: string }
  booking?: { date?: string; duration?: number }
  task?:    { title: string; status: string }
  org?:     { name: string; email?: string }
  time_since_trigger_days?: number
}

async function buildEntityContext(
  entityType: string, entityId: string, orgId: string
): Promise<EntityContext> {
  const org = await db.organization.findUnique({
    where: { id: orgId }, select: { name: true, email: true },
  })
  const ctx: EntityContext = {
    org: { name: org?.name ?? "", email: org?.email ?? undefined },
    time_since_trigger_days: 0,
  }

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
      if (row) ctx.lead = { name: row.name, value: row.value ? Number(row.value) : undefined, source: row.source ?? undefined, stage: row.stage ?? "unknown", email: row.email ?? undefined }
      break
    }
    case "client": {
      const row = await db.client.findFirst({ where: { id: entityId, organizationId: orgId } })
      if (row) ctx.client = { name: row.name, email: row.email ?? undefined, status: row.status, industry: row.industry ?? undefined }
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
  return ctx
}

// ─── Condition evaluator ──────────────────────────────────────────────────────

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
    case "contains":     return strVal.toLowerCase().includes(target.toLowerCase())
    case "not_contains": return !strVal.toLowerCase().includes(target.toLowerCase())
    case "is_empty":     return val == null || strVal === ""
    case "is_not_empty": return val != null && strVal !== ""
    default:             return true
  }
}

function evalCondition(cfg: ConditionConfig, ctx: EntityContext): boolean {
  if (!cfg.conditions?.length) return true
  const results = cfg.conditions.map((r) => evalRule(r, ctx))
  return cfg.logic === "all" ? results.every(Boolean) : results.some(Boolean)
}

// ─── Variable interpolation ───────────────────────────────────────────────────

function interpolate(template: string, ctx: EntityContext): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    const val = getNestedValue(ctx, key.trim())
    return val != null ? String(val) : ""
  })
}

// ─── Action executor ──────────────────────────────────────────────────────────

async function executeAction(
  cfg: ActionConfig,
  ctx: EntityContext,
  orgId: string,
  entityType: string,
  entityId: string,
  runId: string,
  nodeId: string,
): Promise<{ status: "COMPLETED" | "FAILED"; error?: string }> {
  const ac = cfg.action_config as Record<string, unknown>

  try {
    switch (cfg.action_type) {
      // ── Notifications ─────────────────────────────────────────────────────
      case "send_internal_notification": {
        const message = interpolate(String(ac.message ?? "Automation triggered"), ctx)
        await createNotification({
          organizationId: orgId,
          type: "MENTION",
          title: "Automation",
          body: message,
          entityType,
          entityId,
        })
        break
      }

      // ── Email ─────────────────────────────────────────────────────────────
      case "send_email": {
        const to = interpolate(String(ac.to ?? ""), ctx)
        const subject = interpolate(String(ac.subject ?? ""), ctx)
        const body = interpolate(String(ac.body ?? ac.message ?? ""), ctx)
        if (to && subject) {
          await resend.emails.send({
            from: `${ctx.org?.name ?? "ArcheionOS"} <noreply@${process.env.EMAIL_DOMAIN ?? "mail.backoffice.os"}>`,
            to: [to],
            subject,
            html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <p style="font-size:16px;line-height:1.6">${body.replace(/\n/g, "<br/>")}</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="font-size:12px;color:#999">Sent via ${ctx.org?.name ?? "ArcheionOS"} automation</p>
            </div>`,
          })
        }
        break
      }

      // ── Task ──────────────────────────────────────────────────────────────
      case "create_task": {
        const title = interpolate(String(ac.title ?? "Automated task"), ctx)
        const dueDays = ac.due_days_from_now ? Number(ac.due_days_from_now) : undefined
        const dueDate = dueDays ? new Date(Date.now() + dueDays * 86_400_000) : undefined
        await db.task.create({
          data: {
            organizationId: orgId,
            projectId: entityType === "project" ? entityId : null,
            title,
            status: "TODO",
            order: 0,
            dueDate: dueDate ?? null,
          },
        })
        break
      }

      // ── Lead stage ────────────────────────────────────────────────────────
      case "move_lead_stage": {
        const stage = String(ac.stage ?? "")
        if (stage && entityType === "lead") {
          await db.lead.updateMany({
            where: { id: entityId, organizationId: orgId },
            data: { stage },
          })
        }
        break
      }

      // ── Project status ────────────────────────────────────────────────────
      case "change_project_status": {
        const status = String(ac.status ?? "") as ProjectStatus
        const projectId = entityType === "project" ? entityId : null
        if (status && projectId) {
          await db.project.updateMany({
            where: { id: projectId, organizationId: orgId },
            data: { status },
          })
        }
        break
      }

      // ── Archive project ───────────────────────────────────────────────────
      case "archive_project": {
        const projectId = entityType === "project" ? entityId : null
        if (projectId) {
          await db.project.updateMany({
            where: { id: projectId, organizationId: orgId },
            data: { status: "CANCELLED" },
          })
        }
        break
      }

      // ── Client tags ───────────────────────────────────────────────────────
      case "add_client_tag": {
        const tagName = String(ac.tag ?? "")
        const clientId = entityType === "client" ? entityId : null
        if (tagName && clientId) {
          const tag = await db.tag.upsert({
            where: { organizationId_name: { organizationId: orgId, name: tagName } },
            update: {},
            create: { organizationId: orgId, name: tagName, color: "#6366f1" },
          })
          await db.clientTag.upsert({
            where: { clientId_tagId: { clientId, tagId: tag.id } },
            update: {},
            create: { clientId, tagId: tag.id },
          })
        }
        break
      }

      case "remove_client_tag": {
        const tagName = String(ac.tag ?? "")
        const clientId = entityType === "client" ? entityId : null
        if (tagName && clientId) {
          const tag = await db.tag.findFirst({ where: { organizationId: orgId, name: tagName } })
          if (tag) {
            await db.clientTag.deleteMany({ where: { clientId, tagId: tag.id } })
          }
        }
        break
      }

      // ── Webhook ───────────────────────────────────────────────────────────
      case "webhook_post": {
        const url = String(ac.url ?? "")
        if (url) {
          await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orgId, entityType, entityId, context: ctx, runId, nodeId, firedAt: new Date().toISOString() }),
            signal: AbortSignal.timeout(10_000),
          })
        }
        break
      }

      // ── Pause / approval ──────────────────────────────────────────────────
      case "pause_workflow": {
        await db.automationApproval.create({
          data: {
            organizationId: orgId,
            runId,
            nodeId,
            status: "PENDING",
            requestedAt: new Date(),
          },
        })
        // Return a special signal so the walker stops
        return { status: "COMPLETED" }
      }

      default:
        break
    }

    return { status: "COMPLETED" }
  } catch (err) {
    return { status: "FAILED", error: err instanceof Error ? err.message : "Unknown error" }
  }
}

// ─── Calculate delay ──────────────────────────────────────────────────────────

function calculateDelayDate(cfg: DelayConfig): Date {
  if (cfg.mode === "fixed" && cfg.fixed_date) {
    return new Date(cfg.fixed_date)
  }
  const multipliers: Record<string, number> = {
    minutes: 60_000, hours: 3_600_000,
    days: 86_400_000, weeks: 604_800_000,
  }
  const ms = (cfg.amount ?? 1) * (multipliers[cfg.unit ?? "hours"] ?? 3_600_000)
  return new Date(Date.now() + ms)
}

// ─── Graph walker ─────────────────────────────────────────────────────────────

async function walkAndExecute(
  graph: AutomationGraph,
  ctx: EntityContext,
  orgId: string,
  entityType: string,
  entityId: string,
  runId: string,
  startNodeId: string = "trigger",
): Promise<void> {
  const visited = new Set<string>()

  async function walk(nodeId: string | null | undefined): Promise<boolean> {
    if (!nodeId || visited.has(nodeId)) return true
    visited.add(nodeId)

    const node: AutomationNode | undefined = graph.nodes.find((n) => n.id === nodeId)
    if (!node) return true

    switch (node.type) {
      case "trigger":
        // Trigger always passes; log it
        await db.automationRunStep.create({
          data: { runId, nodeId: node.id, nodeType: "trigger", status: "COMPLETED", executedAt: new Date() },
        })
        return walk(node.next)

      case "delay": {
        const cfg = node.config as DelayConfig
        const executeAt = calculateDelayDate(cfg)
        // Save the pending step — cron will resume from node.next
        await db.automationRunStep.create({
          data: {
            runId, nodeId: node.id, nodeType: "delay", status: "PENDING",
            executeAt,
            outputData: JSON.parse(JSON.stringify({ nextNodeId: node.next })),
          },
        })
        // Stop walking — will be resumed later
        return false
      }

      case "condition": {
        const cfg = node.config as ConditionConfig
        const result = evalCondition(cfg, ctx)
        await db.automationRunStep.create({
          data: {
            runId, nodeId: node.id, nodeType: "condition", status: "COMPLETED", executedAt: new Date(),
            outputData: JSON.parse(JSON.stringify({ result, branchTaken: result ? "yes" : "no" })),
          },
        })
        // Walk the taken branch
        const branchStart = result ? node.branches?.yes : node.branches?.no
        const cont = await walk(branchStart)
        // Then continue to merge node (node.next) if present
        if (cont && node.next) await walk(node.next)
        return cont
      }

      case "action": {
        const cfg = node.config as ActionConfig
        // Handle pause_workflow — stops further execution
        if (cfg.action_type === "pause_workflow") {
          await db.automationRunStep.create({
            data: { runId, nodeId: node.id, nodeType: "action", status: "AWAITING_APPROVAL", executedAt: new Date() },
          })
          await db.automationApproval.create({
            data: { organizationId: orgId, runId, nodeId: node.id, status: "PENDING", requestedAt: new Date() },
          })
          return false
        }

        const result = await executeAction(cfg, ctx, orgId, entityType, entityId, runId, node.id)
        await db.automationRunStep.create({
          data: {
            runId, nodeId: node.id, nodeType: "action",
            status: result.status,
            error: result.error ?? null,
            executedAt: new Date(),
          },
        })

        // On error with on_error = "pause", stop
        if (result.status === "FAILED" && cfg.on_error === "pause") return false

        return walk(node.next)
      }
    }
    return true
  }

  await walk(startNodeId)
}

// ─── Legacy action runner (fallback for old automations) ─────────────────────

async function runLegacyActions(
  automation: { id: string; name: string; actions: unknown },
  orgId: string, entityType: string, entityId: string,
  ctx: EntityContext,
): Promise<void> {
  const actionList = Array.isArray(automation.actions)
    ? (automation.actions as { type: string; config: Record<string, string> }[])
    : []

  for (const action of actionList) {
    try {
      if (action.type === "send_notification" || action.type === "send_internal_notification") {
        await createNotification({
          organizationId: orgId, type: "MENTION",
          title: "Automation triggered",
          body: interpolate(action.config.message ?? `Automation "${automation.name}" fired.`, ctx),
          entityType, entityId,
        })
      } else if (action.type === "create_task") {
        await db.task.create({
          data: {
            organizationId: orgId,
            projectId: entityType === "project" ? entityId : null,
            title: action.config.title ?? "Automated task",
            status: "TODO", order: 0,
          },
        })
      } else if (action.type === "webhook" || action.type === "webhook_post") {
        if (action.config.url) {
          await fetch(action.config.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ automationId: automation.id, trigger: entityType, entityId, firedAt: new Date().toISOString() }),
            signal: AbortSignal.timeout(10_000),
          }).catch(() => {})
        }
      }
    } catch {
      // non-fatal
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Find and run all active automations matching the trigger.
 * Non-throwing — errors are logged but don't break the caller.
 */
export async function runAutomations(
  orgId: string,
  triggerType: string,
  entityType: string,
  entityId: string,
): Promise<void> {
  try {
    const automations = await db.automation.findMany({
      where: { organizationId: orgId, triggerType, isActive: true },
    })
    if (!automations.length) return

    // Build entity context once for all automations
    const ctx = await buildEntityContext(entityType, entityId, orgId)

    for (const automation of automations) {
      try {
        const hasGraph =
          automation.nodes &&
          typeof automation.nodes === "object" &&
          "nodes" in (automation.nodes as object) &&
          Array.isArray((automation.nodes as unknown as AutomationGraph).nodes)

        // Create the run record
        const run = await db.automationRun.create({
          data: {
            automationId: automation.id,
            organizationId: orgId,
            clientId: null,
            entityType,
            entityId,
            status: "RUNNING",
            dryRun: false,
            ranAt: new Date(),
          },
        })

        if (hasGraph) {
          // Execute visual graph
          await walkAndExecute(
            automation.nodes as unknown as AutomationGraph,
            ctx, orgId, entityType, entityId, run.id,
          )
        } else {
          // Fall back to legacy flat actions
          await runLegacyActions(
            { id: automation.id, name: automation.name, actions: automation.actions },
            orgId, entityType, entityId, ctx,
          )
        }

        // Mark run complete
        await db.automationRun.update({
          where: { id: run.id },
          data: { status: "COMPLETED", completedAt: new Date() },
        })

        await db.automation.update({
          where: { id: automation.id },
          data: { lastRunAt: new Date(), runCount: { increment: 1 } },
        })
      } catch {
        // Non-fatal per-automation failure
      }
    }
  } catch {
    // Non-fatal overall
  }
}

/**
 * Resume a delayed automation run from a specific step.
 * Called by the process-delayed cron endpoint.
 */
export async function resumeDelayedStep(stepId: string): Promise<void> {
  const step = await db.automationRunStep.findUnique({
    where: { id: stepId },
    include: { run: { include: { automation: true } } },
  })
  if (!step || step.status !== "PENDING") return
  if (!step.run?.automation) return

  const automation = step.run.automation
  const run = step.run
  if (!run.organizationId) return
  const nextNodeId = (step.outputData as Record<string, unknown>)?.nextNodeId as string | undefined
  if (!nextNodeId) return

  const hasGraph =
    automation.nodes &&
    typeof automation.nodes === "object" &&
    "nodes" in (automation.nodes as object)

  if (!hasGraph) return

  // Mark this step completed
  await db.automationRunStep.update({ where: { id: stepId }, data: { status: "COMPLETED", executedAt: new Date() } })

  // Rebuild context and continue — orgId is guaranteed non-null by guard above
  const orgId = run.organizationId
  const eType = run.entityType ?? ""
  const eId = run.entityId ?? ""
  const ctx = await buildEntityContext(eType, eId, orgId)
  await walkAndExecute(
    automation.nodes as unknown as AutomationGraph,
    ctx, orgId, eType, eId, run.id, nextNodeId,
  )

  await db.automationRun.update({ where: { id: run.id }, data: { status: "COMPLETED", completedAt: new Date() } })
}
