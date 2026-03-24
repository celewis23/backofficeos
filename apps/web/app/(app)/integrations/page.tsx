import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { IntegrationsClient } from "./integrations-client"

export const metadata = { title: "Integrations — BackOfficeOS" }

export default async function IntegrationsPage() {
  const { orgId } = await requireOrg()

  const integrations = await db.integration.findMany({
    where: { organizationId: orgId },
  })

  return <IntegrationsClient activeIntegrations={integrations} />
}
