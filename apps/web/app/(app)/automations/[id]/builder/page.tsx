import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { BuilderClient } from "./builder-client"
import { createBlankAutomation } from "./actions"

export const metadata: Metadata = { title: "Workflow Builder — ArcheionOS" }

export default async function BuilderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { orgId } = await requireOrg()

  if (id === "new") {
    const result = await createBlankAutomation()
    redirect(`/automations/${result.id}/builder`)
  }

  const automation = await db.automation.findFirst({
    where: { id, organizationId: orgId },
    include: {
      runs: {
        orderBy: { ranAt: "desc" },
        take: 20,
        include: { steps: true },
      },
    },
  })

  if (!automation) notFound()

  return (
    <BuilderClient
      automation={{
        id: automation.id,
        name: automation.name,
        triggerType: automation.triggerType,
        isActive: automation.isActive,
        nodes: automation.nodes,
        runs: automation.runs.map((r) => ({
          id: r.id,
          status: r.status,
          entityType: r.entityType ?? null,
          entityId: r.entityId ?? null,
          dryRun: r.dryRun,
          ranAt: r.ranAt.toISOString(),
          completedAt: r.completedAt?.toISOString() ?? null,
          steps: r.steps.map((s) => ({
            id: s.id,
            nodeId: s.nodeId,
            nodeType: s.nodeType,
            status: s.status,
            error: s.error ?? null,
            executedAt: s.executedAt?.toISOString() ?? null,
          })),
        })),
      }}
    />
  )
}
