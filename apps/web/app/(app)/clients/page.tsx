import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { ClientsClient } from "./clients-client"

export const metadata = { title: "Clients — ArcheionOS" }

export default async function ClientsPage() {
  const { orgId } = await requireOrg()

  const clients = await db.client.findMany({
    where: { organizationId: orgId },
    include: {
      _count: {
        select: {
          invoices: true,
          projects: true,
          contacts: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return <ClientsClient clients={clients} />
}
