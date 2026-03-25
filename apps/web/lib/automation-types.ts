// ─── Shared TypeScript types for the visual automation builder ───────────────
// Node IDs use nanoid-style short IDs (8 chars)

export type AutomationNodeType = "trigger" | "delay" | "condition" | "action"

export type DelayUnit = "minutes" | "hours" | "days" | "weeks"
export type DelayMode = "relative" | "fixed"

export type ConditionLogic = "all" | "any"
export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "greater_than"
  | "less_than"
  | "contains"
  | "not_contains"
  | "is_empty"
  | "is_not_empty"

export type OnError = "skip" | "pause" | "notify"

export interface ConditionRule {
  field: string      // e.g. "project.budget", "client.tag", "invoice.amount"
  operator: ConditionOperator
  value: string
}

// ─── Node config shapes ────────────────────────────────────────────────────

export interface TriggerConfig {
  trigger_type: string
  trigger_config?: Record<string, unknown>
}

export interface DelayConfig {
  amount: number
  unit: DelayUnit
  mode: DelayMode
  fixed_date?: string   // ISO string
  condition?: "immediately" | "if_not_completed"
}

export interface ConditionConfig {
  logic: ConditionLogic
  conditions: ConditionRule[]
  on_error: OnError
  require_approval?: boolean
}

export interface ActionConfig {
  action_type: string
  action_config: Record<string, unknown>
  require_approval: boolean
  on_error: OnError
}

export type NodeConfig = TriggerConfig | DelayConfig | ConditionConfig | ActionConfig

// ─── Node shape ───────────────────────────────────────────────────────────

export interface AutomationNode {
  id: string
  type: AutomationNodeType
  position?: { x: number; y: number }
  config: NodeConfig
  /** ID of the next node on the main (or yes) path */
  next?: string | null
  /** Branch targets — only for condition nodes */
  branches?: {
    yes?: string | null
    no?: string | null
  }
}

export interface AutomationGraph {
  nodes: AutomationNode[]
}

// ─── Action types and their display labels ────────────────────────────────

export const ACTION_TYPES = [
  { value: "send_email",               label: "Send email",                    icon: "Mail" },
  { value: "send_sms",                 label: "Send SMS",                      icon: "MessageSquare" },
  { value: "send_form",                label: "Send intake form",              icon: "ClipboardList" },
  { value: "send_contract",            label: "Send contract",                 icon: "FileSignature" },
  { value: "send_invoice",             label: "Send invoice",                  icon: "Receipt" },
  { value: "send_scheduler",           label: "Send scheduling link",          icon: "CalendarDays" },
  { value: "create_task",              label: "Create task",                   icon: "CheckSquare" },
  { value: "change_project_status",    label: "Change project status",         icon: "FolderKanban" },
  { value: "move_lead_stage",          label: "Move lead stage",               icon: "ArrowRight" },
  { value: "add_client_tag",           label: "Add client tag",                icon: "Tag" },
  { value: "remove_client_tag",        label: "Remove client tag",             icon: "TagOff" },
  { value: "activate_portal",          label: "Activate/deactivate portal",    icon: "Globe" },
  { value: "archive_project",          label: "Archive project",               icon: "Archive" },
  { value: "apply_workflow",           label: "Apply child workflow",          icon: "Workflow" },
  { value: "pause_workflow",           label: "Pause workflow",                icon: "PauseCircle" },
  { value: "send_internal_notification", label: "Send internal notification",  icon: "Bell" },
  { value: "post_slack",               label: "Post Slack message",            icon: "Hash" },
  { value: "webhook_post",             label: "Webhook POST",                  icon: "Webhook" },
] as const

export type ActionType = (typeof ACTION_TYPES)[number]["value"]

// ─── Trigger types and their display labels ───────────────────────────────

export const TRIGGER_TYPES = [
  // Contracts
  { value: "contract_signed",         label: "Contract signed",           group: "Contracts" },
  { value: "contract_declined",       label: "Contract declined",         group: "Contracts" },
  { value: "contract_expired",        label: "Contract expired",          group: "Contracts" },
  // Invoices
  { value: "invoice_paid_full",       label: "Invoice paid in full",      group: "Invoices" },
  { value: "invoice_installment_paid",label: "Installment paid",          group: "Invoices" },
  { value: "invoice_overdue",         label: "Invoice overdue",           group: "Invoices" },
  { value: "invoice_sent",            label: "Invoice sent",              group: "Invoices" },
  { value: "invoice_viewed",          label: "Invoice viewed",            group: "Invoices" },
  // Forms
  { value: "form_completed",          label: "Form completed",            group: "Forms" },
  { value: "form_not_completed",      label: "Form not completed",        group: "Forms" },
  // Bookings
  { value: "booking_confirmed",       label: "Booking confirmed",         group: "Bookings" },
  { value: "booking_cancelled",       label: "Booking cancelled",         group: "Bookings" },
  { value: "booking_no_show",         label: "Booking no-show",           group: "Bookings" },
  { value: "appointment_before",      label: "Before appointment",        group: "Bookings" },
  { value: "appointment_after",       label: "After appointment",         group: "Bookings" },
  // Leads
  { value: "lead_stage_changed",      label: "Lead stage changed",        group: "Leads" },
  { value: "lead_created",            label: "Lead created",              group: "Leads" },
  { value: "lead_won",                label: "Lead won",                  group: "Leads" },
  { value: "lead_lost",               label: "Lead lost",                 group: "Leads" },
  // Clients
  { value: "client_created",          label: "Client created",            group: "Clients" },
  { value: "client_status_changed",   label: "Client status changed",     group: "Clients" },
  // Tasks
  { value: "task_assigned",           label: "Task assigned",             group: "Tasks" },
  { value: "task_due_soon",           label: "Task due soon",             group: "Tasks" },
  { value: "task_completed",          label: "Task completed",            group: "Tasks" },
  // Projects
  { value: "project_status_changed",  label: "Project status changed",    group: "Projects" },
  { value: "project_start_date",      label: "Project start date",        group: "Projects" },
  { value: "project_end_date",        label: "Project end date",          group: "Projects" },
  // Other
  { value: "time_entry_submitted",    label: "Time entry submitted",      group: "Other" },
  { value: "manual",                  label: "Manual trigger",            group: "Other" },
] as const

export type TriggerType = (typeof TRIGGER_TYPES)[number]["value"]

// ─── Condition fields ─────────────────────────────────────────────────────

export const CONDITION_FIELDS = [
  { value: "project.budget",          label: "Project budget" },
  { value: "project.status",          label: "Project status" },
  { value: "client.tag",              label: "Client tag" },
  { value: "client.status",           label: "Client status" },
  { value: "client.industry",         label: "Client industry" },
  { value: "invoice.amount",          label: "Invoice amount" },
  { value: "invoice.status",          label: "Invoice status" },
  { value: "lead.value",              label: "Lead value" },
  { value: "lead.source",             label: "Lead source" },
  { value: "lead.stage",              label: "Lead stage" },
  { value: "time_since_trigger_days", label: "Days since trigger" },
]

export const CONDITION_OPERATORS: { value: ConditionOperator; label: string }[] = [
  { value: "equals",       label: "equals" },
  { value: "not_equals",   label: "does not equal" },
  { value: "greater_than", label: "greater than" },
  { value: "less_than",    label: "less than" },
  { value: "contains",     label: "contains" },
  { value: "not_contains", label: "does not contain" },
  { value: "is_empty",     label: "is empty" },
  { value: "is_not_empty", label: "is not empty" },
]

// ─── Helper to generate node IDs ─────────────────────────────────────────

export function makeNodeId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let id = ""
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}

// ─── Helper to get a human-readable summary of a node ────────────────────

export function nodeTitle(node: AutomationNode): string {
  switch (node.type) {
    case "trigger": {
      const cfg = node.config as TriggerConfig
      return TRIGGER_TYPES.find((t) => t.value === cfg.trigger_type)?.label ?? cfg.trigger_type ?? "Trigger"
    }
    case "delay": {
      const cfg = node.config as DelayConfig
      if (cfg.mode === "fixed" && cfg.fixed_date) return `Wait until ${new Date(cfg.fixed_date).toLocaleDateString()}`
      return `Wait ${cfg.amount} ${cfg.unit}`
    }
    case "condition": {
      const cfg = node.config as ConditionConfig
      const count = cfg.conditions?.length ?? 0
      return `Check: ${count} condition${count !== 1 ? "s" : ""}`
    }
    case "action": {
      const cfg = node.config as ActionConfig
      return ACTION_TYPES.find((a) => a.value === cfg.action_type)?.label ?? cfg.action_type ?? "Action"
    }
    default:
      return "Node"
  }
}

export function nodeSubtitle(node: AutomationNode): string {
  switch (node.type) {
    case "trigger": {
      const cfg = node.config as TriggerConfig
      return "Fires immediately"
    }
    case "delay": {
      const cfg = node.config as DelayConfig
      return cfg.mode === "fixed" ? "Fixed date" : `Relative delay`
    }
    case "condition": {
      const cfg = node.config as ConditionConfig
      return `Logic: ${cfg.logic === "all" ? "All must match" : "Any must match"}`
    }
    case "action": {
      const cfg = node.config as ActionConfig
      if (cfg.action_type === "send_email") {
        const ac = cfg.action_config as { subject?: string }
        return ac.subject ? `Subject: ${ac.subject}` : "Email action"
      }
      if (cfg.action_type === "create_task") {
        const ac = cfg.action_config as { title?: string }
        return ac.title ? `Task: ${ac.title}` : "Create task"
      }
      return ACTION_TYPES.find((a) => a.value === cfg.action_type)?.label ?? ""
    }
    default:
      return ""
  }
}

// ─── Empty graph factory ─────────────────────────────────────────────────

export function emptyGraph(triggerType?: string): AutomationGraph {
  return {
    nodes: [
      {
        id: "trigger",
        type: "trigger",
        config: {
          trigger_type: triggerType ?? "manual",
          trigger_config: {},
        },
        next: null,
      },
    ],
  }
}

// ─── Graph traversal helpers ─────────────────────────────────────────────

/** Get all nodes reachable from a given node ID following the main `next` chain */
export function getChain(graph: AutomationGraph, fromId: string | null | undefined): AutomationNode[] {
  if (!fromId) return []
  const visited = new Set<string>()
  const result: AutomationNode[] = []
  let current: string | null | undefined = fromId
  while (current) {
    if (visited.has(current)) break
    visited.add(current)
    const node = graph.nodes.find((n) => n.id === current)
    if (!node) break
    result.push(node)
    current = node.next
  }
  return result
}

/** Insert a new node after the given node ID */
export function insertAfter(
  graph: AutomationGraph,
  afterId: string,
  newNode: AutomationNode,
  branch?: "yes" | "no"
): AutomationGraph {
  const nodes = graph.nodes.map((n) => {
    if (n.id !== afterId) return n
    if (branch && n.type === "condition") {
      const existing = n.branches?.[branch]
      return {
        ...n,
        branches: {
          ...n.branches,
          [branch]: newNode.id,
        },
      }
    }
    // If there's already a next, the new node takes its place and points forward
    const existingNext = n.next
    newNode = { ...newNode, next: existingNext }
    return { ...n, next: newNode.id }
  })

  return { nodes: [...nodes, newNode] }
}

/** Remove a node from the graph, reconnecting its predecessor to its successor */
export function removeNode(graph: AutomationGraph, nodeId: string): AutomationGraph {
  const target = graph.nodes.find((n) => n.id === nodeId)
  if (!target || target.id === "trigger") return graph

  const nodes = graph.nodes
    .filter((n) => n.id !== nodeId)
    .map((n) => {
      if (n.next === nodeId) return { ...n, next: target.next ?? null }
      if (n.branches?.yes === nodeId) return { ...n, branches: { ...n.branches, yes: target.next ?? null } }
      if (n.branches?.no === nodeId) return { ...n, branches: { ...n.branches, no: target.next ?? null } }
      return n
    })

  return { nodes }
}
