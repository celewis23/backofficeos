"use server"

import { redirect } from "next/navigation"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { AUTOMATION_TEMPLATES } from "@/lib/automation-templates"

export async function createFromTemplate(templateId: string) {
  const { orgId, session } = await requireOrg()

  const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId)
  if (!template) return { error: "Template not found" }

  const automation = await db.automation.create({
    data: {
      organizationId: orgId,
      name: template.name,
      description: template.description,
      triggerType: template.triggerType,
      triggerConfig: {},
      actions: [],             // legacy field — required by schema, empty for graph automations
      nodes: template.graph as unknown as Parameters<typeof db.automation.create>[0]["data"]["nodes"],
      createdBy: session.user.id,
      isActive: false,         // start paused so user can review before enabling
    },
  })

  redirect(`/automations/${automation.id}/builder`)
}
