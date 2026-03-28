import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { generateObject } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const SuggestionSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string().describe("Short node title, e.g. 'Send welcome email'"),
      description: z.string().describe("One sentence explaining what this step does and why it helps"),
      nodeType: z.enum(["action", "condition", "delay"]),
      actionType: z.string().optional().describe(
        "Only set when nodeType is 'action'. One of: send_email, send_sms, send_form, send_contract, " +
        "send_invoice, send_scheduler, create_task, change_project_status, move_lead_stage, " +
        "add_client_tag, remove_client_tag, activate_portal, archive_project, apply_workflow, " +
        "pause_workflow, send_internal_notification, post_slack, webhook_post"
      ),
    })
  ).min(2).max(4),
})

export async function POST(req: NextRequest) {
  try {
    await requireOrg()

    const body = await req.json() as {
      triggerType?: string
      automationName?: string
      currentNodeType?: string
      currentNodeTitle?: string
      existingStepCount?: number
      workflowSummary?: string
    }

    const {
      triggerType = "unknown",
      automationName = "Automation",
      currentNodeType = "action",
      currentNodeTitle = "",
      existingStepCount = 1,
      workflowSummary = "",
    } = body

    const prompt = `You are an expert workflow automation consultant for a business management platform (CRM, billing, projects, HR).

A user is building an automation workflow and wants suggestions for what to add next.

Workflow context:
- Name: "${automationName}"
- Trigger: ${triggerType.replace(/_/g, " ")}
- Current step: ${currentNodeType} — "${currentNodeTitle}"
- Steps in workflow so far: ${existingStepCount}
${workflowSummary ? `- Workflow so far: ${workflowSummary}` : ""}

Suggest 3 practical next steps that would naturally follow this node. Be specific and actionable.
Consider: follow-up communications, status changes, task creation, conditional branching, delays for timing, notifications.

Return only the JSON — no other text.`

    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5"),
      schema: SuggestionSchema,
      prompt,
    })

    return NextResponse.json(object)
  } catch (e) {
    console.error("Suggest error:", e)
    return NextResponse.json({ error: "Failed to generate suggestions" }, { status: 500 })
  }
}
