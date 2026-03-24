import type { Metadata } from "next"
import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { CRMClient } from "./crm-client"

export const metadata: Metadata = { title: "CRM Pipeline" }

export default async function CRMPage() {
  const { orgId } = await requireOrg()

  const leads = await db.lead.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
  })

  const stats = {
    total: leads.length,
    totalValue: leads.reduce((s, l) => s + Number(l.value ?? 0), 0),
    won: leads.filter((l) => l.status === "WON").length,
    wonValue: leads.filter((l) => l.status === "WON").reduce((s, l) => s + Number(l.value ?? 0), 0),
  }

  return <CRMClient leads={leads} stats={stats} />
}
