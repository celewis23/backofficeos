import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { notFound } from "next/navigation"
import { ClientDetail } from "./client-detail"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const client = await db.client.findUnique({ where: { id }, select: { name: true } })
  return { title: client ? `${client.name} — Clients` : "Client not found" }
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params
  const { orgId } = await requireOrg()

  const client = await db.client.findUnique({
    where: { id, organizationId: orgId },
    include: {
      contacts: { orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
      invoices: { orderBy: { createdAt: "desc" }, take: 10 },
      projects: { orderBy: { createdAt: "desc" }, take: 10 },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
      tags: { include: { tag: true } },
    },
  })

  if (!client) notFound()

  return <ClientDetail client={client} />
}
