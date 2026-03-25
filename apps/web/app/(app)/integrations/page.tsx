import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { IntegrationsClient } from "./integrations-client"

export const metadata = { title: "Integrations — ArcheionOS" }

export default async function IntegrationsPage() {
  const { orgId } = await requireOrg()

  const [integrations, posConnections, posStats] = await Promise.all([
    db.integration.findMany({
      where: { organizationId: orgId },
    }),
    db.platformConnection.findMany({
      where: { organizationId: orgId, category: "pos" },
    }),
    // Today's POS totals
    db.posTransaction.aggregate({
      where: {
        organizationId: orgId,
        occurredAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ])

  return (
    <IntegrationsClient
      activeIntegrations={integrations}
      posConnections={posConnections}
      posStats={{
        todayTotal: Number(posStats._sum.amount ?? 0),
        todayCount: posStats._count.id,
      }}
    />
  )
}
