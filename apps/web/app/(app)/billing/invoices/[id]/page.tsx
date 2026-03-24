import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { InvoiceDetail } from "./invoice-detail"

interface Props {
  params: Promise<{ id: string }>
}

export default async function InvoicePage({ params }: Props) {
  const { id } = await params
  const { orgId } = await requireOrg()

  const invoice = await db.invoice.findFirst({
    where: { id, organizationId: orgId },
    include: {
      client: {
        select: { id: true, name: true, email: true, phone: true, avatar: true, address: true },
      },
      items: { orderBy: { order: "asc" } },
      payments: { orderBy: { paidAt: "desc" } },
    },
  })

  if (!invoice) notFound()

  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true, logo: true, metadata: true },
  })

  return <InvoiceDetail invoice={invoice} org={org} />
}
