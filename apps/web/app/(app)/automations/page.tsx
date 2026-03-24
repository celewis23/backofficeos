import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { AutomationsClient } from "./automations-client"

export default async function AutomationsPage() {
  const { orgId } = await requireOrg()

  const automations = await db.automation.findMany({
    where: { organizationId: orgId },
    include: {
      runs: { orderBy: { ranAt: "desc" }, take: 1 },
      _count: { select: { runs: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return <AutomationsClient automations={automations} />
}
