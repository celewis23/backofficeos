/**
 * Built-in automation templates.
 * Each template ships with a complete visual AutomationGraph.
 */

import type { AutomationGraph } from "./automation-types"

export type AutomationTemplate = {
  id: string
  name: string
  description: string
  category: "clients" | "billing" | "leads" | "projects" | "bookings"
  triggerType: string
  estimatedSaving: string
  graph: AutomationGraph
}

// ─── Category labels ──────────────────────────────────────────────────────────

export const TEMPLATE_CATEGORIES: Record<AutomationTemplate["category"], string> = {
  clients: "Clients",
  billing: "Billing",
  leads: "CRM & Leads",
  projects: "Projects",
  bookings: "Bookings",
}

// ─── Templates ────────────────────────────────────────────────────────────────

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  // ── 1. Welcome new client ─────────────────────────────────────────────────
  {
    id: "welcome-new-client",
    name: "Welcome New Client",
    description: "Automatically welcome new clients with an email, tag them, and create an onboarding task.",
    category: "clients",
    triggerType: "client_created",
    estimatedSaving: "Saves ~30 min per new client",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "client_created" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Welcome to {{org.name}}, {{client.name}}!",
              body: "Hi {{client.name}},\n\nWelcome! We're excited to work with you.\n\nWe'll be in touch shortly to get started.\n\nBest,\n{{org.name}} Team",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "add_client_tag",
            action_config: { tag: "New Client" },
            require_approval: false,
            on_error: "skip",
          },
          next: "a3",
        },
        {
          id: "a3",
          type: "action",
          config: {
            action_type: "create_task",
            action_config: { title: "Schedule onboarding call with {{client.name}}", due_days_from_now: "3" },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 2. Invoice overdue follow-up ─────────────────────────────────────────
  {
    id: "invoice-overdue-reminder",
    name: "Invoice Overdue Follow-Up",
    description: "Wait 1 day, then send a payment reminder email and create a follow-up task for your team.",
    category: "billing",
    triggerType: "invoice_overdue",
    estimatedSaving: "Saves ~1h per overdue invoice",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "invoice_overdue" },
          next: "d1",
        },
        {
          id: "d1",
          type: "delay",
          config: { mode: "relative", amount: 1, unit: "days" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Friendly reminder: Invoice {{invoice.number}} is overdue",
              body: "Hi {{client.name}},\n\nThis is a friendly reminder that invoice {{invoice.number}} for ${{invoice.amount}} is now overdue.\n\nPlease arrange payment at your earliest convenience.\n\nThank you,\n{{org.name}}",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "Invoice {{invoice.number}} ({{client.name}}, ${{invoice.amount}}) is overdue — follow-up email sent." },
            require_approval: false,
            on_error: "skip",
          },
          next: "a3",
        },
        {
          id: "a3",
          type: "action",
          config: {
            action_type: "create_task",
            action_config: { title: "Follow up on overdue invoice {{invoice.number}} — {{client.name}}", due_days_from_now: "2" },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 3. Invoice paid thank you ────────────────────────────────────────────
  {
    id: "invoice-paid-thankyou",
    name: "Invoice Paid — Thank You",
    description: "Send an instant thank-you email when a client pays an invoice and notify your team.",
    category: "billing",
    triggerType: "invoice_paid_full",
    estimatedSaving: "Saves ~15 min per payment",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "invoice_paid_full" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Payment received — Invoice {{invoice.number}}",
              body: "Hi {{client.name}},\n\nThank you! We've received your payment of ${{invoice.amount}} for invoice {{invoice.number}}.\n\nWe appreciate your business.\n\n{{org.name}}",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "Payment received: Invoice {{invoice.number}} — {{client.name}} paid ${{invoice.amount}}." },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 4. Lead won — new client onboarding ──────────────────────────────────
  {
    id: "lead-won-onboarding",
    name: "Lead Won → Client Onboarding",
    description: "When a deal closes, notify your team, move to the next stage, and kick off onboarding.",
    category: "leads",
    triggerType: "lead_won",
    estimatedSaving: "Saves ~45 min per deal",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "lead_won" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "🎉 Deal won: {{lead.name}} (${{lead.value}})! Time to kick off onboarding." },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{lead.email}}",
              subject: "Welcome aboard, {{lead.name}}!",
              body: "Hi {{lead.name}},\n\nWe're thrilled to welcome you as a new client of {{org.name}}!\n\nOur team will reach out shortly to get everything set up.\n\nExcited to work together,\n{{org.name}} Team",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: "a3",
        },
        {
          id: "a3",
          type: "action",
          config: {
            action_type: "create_task",
            action_config: { title: "Onboarding: set up account for {{lead.name}}", due_days_from_now: "2" },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 5. Lead lost recovery ────────────────────────────────────────────────
  {
    id: "lead-lost-recovery",
    name: "Lead Lost — Recovery Check-In",
    description: "Wait 14 days after losing a deal, then send a re-engagement email to keep the door open.",
    category: "leads",
    triggerType: "lead_lost",
    estimatedSaving: "Recovers ~10% of lost leads",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "lead_lost" },
          next: "d1",
        },
        {
          id: "d1",
          type: "delay",
          config: { mode: "relative", amount: 14, unit: "days" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{lead.email}}",
              subject: "Checking in — {{org.name}}",
              body: "Hi {{lead.name}},\n\nI wanted to check in and see how things are going. If circumstances have changed and you'd like to revisit working together, we'd love to reconnect.\n\nNo pressure — just wanted to stay in touch.\n\nBest,\n{{org.name}} Team",
            },
            require_approval: true,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "Re-engagement email sent to lost lead: {{lead.name}}" },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 6. Contract signed kickoff ───────────────────────────────────────────
  {
    id: "contract-signed-kickoff",
    name: "Contract Signed — Project Kickoff",
    description: "When a contract is signed, alert your team and automatically create a kickoff task.",
    category: "clients",
    triggerType: "contract_signed",
    estimatedSaving: "Saves ~20 min per contract",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "contract_signed" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "✅ Contract signed: {{contract.name}} — {{client.name}}. Ready to kick off!" },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "create_task",
            action_config: { title: "Kickoff meeting: {{client.name}} — {{contract.name}}", due_days_from_now: "3" },
            require_approval: false,
            on_error: "skip",
          },
          next: "a3",
        },
        {
          id: "a3",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Contract signed — next steps for {{contract.name}}",
              body: "Hi {{client.name}},\n\nThank you for signing the contract! We're excited to get started.\n\nOur team will be in touch within the next few days to schedule a kickoff meeting.\n\n{{org.name}}",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 7. Booking confirmation + reminder ───────────────────────────────────
  {
    id: "booking-confirmed-reminder",
    name: "Booking Confirmed + Reminder",
    description: "Send an immediate confirmation email and a reminder 24 hours before the appointment.",
    category: "bookings",
    triggerType: "booking_confirmed",
    estimatedSaving: "Reduces no-shows by ~40%",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "booking_confirmed" },
          next: "a1",
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Booking confirmed — {{org.name}}",
              body: "Hi {{client.name}},\n\nYour booking has been confirmed! We look forward to seeing you.\n\nIf you need to reschedule, please let us know as soon as possible.\n\n{{org.name}}",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "New booking confirmed: {{client.name}}" },
            require_approval: false,
            on_error: "skip",
          },
          next: "d1",
        },
        {
          id: "d1",
          type: "delay",
          config: { mode: "relative", amount: 23, unit: "hours" },
          next: "a3",
        },
        {
          id: "a3",
          type: "action",
          config: {
            action_type: "send_email",
            action_config: {
              to: "{{client.email}}",
              subject: "Reminder: Your appointment with {{org.name}} is tomorrow",
              body: "Hi {{client.name}},\n\nJust a friendly reminder that your appointment is tomorrow.\n\nSee you then!\n\n{{org.name}}",
            },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },

  // ── 8. High-value lead alert ─────────────────────────────────────────────
  {
    id: "high-value-lead-alert",
    name: "High-Value Lead Alert",
    description: "When a lead's value exceeds your threshold, instantly notify your team and assign a follow-up task.",
    category: "leads",
    triggerType: "lead_stage_changed",
    estimatedSaving: "Never miss a big opportunity",
    graph: {
      nodes: [
        {
          id: "trigger",
          type: "trigger",
          config: { trigger_type: "lead_stage_changed" },
          next: "c1",
        },
        {
          id: "c1",
          type: "condition",
          config: {
            logic: "all",
            conditions: [{ field: "lead.value", operator: "greater_than", value: "5000" }],
            on_error: "skip",
          },
          branches: { yes: "a1", no: null },
          next: null,
        },
        {
          id: "a1",
          type: "action",
          config: {
            action_type: "send_internal_notification",
            action_config: { message: "🔥 High-value lead alert: {{lead.name}} — ${{lead.value}}. Follow up ASAP!" },
            require_approval: false,
            on_error: "skip",
          },
          next: "a2",
        },
        {
          id: "a2",
          type: "action",
          config: {
            action_type: "create_task",
            action_config: { title: "Priority follow-up: {{lead.name}} (${{lead.value}})", due_days_from_now: "1" },
            require_approval: false,
            on_error: "skip",
          },
          next: null,
        },
      ],
    },
  },
]
