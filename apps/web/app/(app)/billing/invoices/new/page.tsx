import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { InvoiceBuilder } from "./invoice-builder"

export const metadata = { title: "New Invoice — ArcheionOS" }

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const { orgId } = await requireOrg()
  const { clientId } = await searchParams

  const clients = await db.client.findMany({
    where: { organizationId: orgId, status: { not: "ARCHIVED" } },
    select: { id: true, name: true, email: true, currency: true, paymentTerms: true },
    orderBy: { name: "asc" },
  })

  // Auto-number the next invoice
  const lastInvoice = await db.invoice.findFirst({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    select: { number: true },
  })

  const nextNumber = generateNextNumber(lastInvoice?.number)

  return (
    <InvoiceBuilder
      clients={clients}
      defaultClientId={clientId}
      nextNumber={nextNumber}
      orgId={orgId}
    />
  )
}

function generateNextNumber(lastNumber?: string): string {
  if (!lastNumber) return "INV-0001"
  const match = lastNumber.match(/(\d+)$/)
  if (!match) return "INV-0001"
  const next = parseInt(match[1], 10) + 1
  return `INV-${String(next).padStart(4, "0")}`
}
