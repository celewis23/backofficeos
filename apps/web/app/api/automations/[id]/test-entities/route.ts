import { NextRequest, NextResponse } from "next/server"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

// Map trigger prefix → entity type
function triggerToEntityType(triggerType: string): string {
  if (triggerType.startsWith("contract_"))   return "contract"
  if (triggerType.startsWith("invoice_"))    return "invoice"
  if (triggerType.startsWith("lead_"))       return "lead"
  if (triggerType.startsWith("client_"))     return "client"
  if (triggerType.startsWith("project_"))    return "project"
  if (triggerType.startsWith("task_"))       return "task"
  if (triggerType.startsWith("booking_") || triggerType.startsWith("appointment_")) return "booking"
  if (triggerType.startsWith("form_"))       return "form"
  return "none"
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireOrg()

    const automation = await db.automation.findFirst({ where: { id, organizationId: orgId } })
    if (!automation) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const entityType = triggerToEntityType(automation.triggerType)

    let entities: { id: string; label: string }[] = []

    switch (entityType) {
      case "invoice": {
        const rows = await db.invoice.findMany({
          where: { organizationId: orgId },
          select: { id: true, number: true, total: true, client: { select: { name: true } } },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `#${r.number} — ${r.client?.name ?? "?"} ($${r.total})` }))
        break
      }
      case "contract": {
        const rows = await db.contract.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, status: true, client: { select: { name: true } } },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `${r.title} — ${r.client?.name ?? "?"} (${r.status})` }))
        break
      }
      case "lead": {
        const rows = await db.lead.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, stage: true },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `${r.name} (${r.stage})` }))
        break
      }
      case "client": {
        const rows = await db.client.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, email: true },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `${r.name}${r.email ? ` — ${r.email}` : ""}` }))
        break
      }
      case "project": {
        const rows = await db.project.findMany({
          where: { organizationId: orgId },
          select: { id: true, name: true, status: true },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `${r.name} (${r.status})` }))
        break
      }
      case "task": {
        const rows = await db.task.findMany({
          where: { organizationId: orgId },
          select: { id: true, title: true, status: true },
          orderBy: { createdAt: "desc" }, take: 20,
        })
        entities = rows.map((r) => ({ id: r.id, label: `${r.title} (${r.status})` }))
        break
      }
      default:
        break
    }

    return NextResponse.json({ entityType, entities })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
