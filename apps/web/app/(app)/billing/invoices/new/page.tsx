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

  const [clients, catalogItems, lastInvoice] = await Promise.all([
    db.client.findMany({
      where: { organizationId: orgId, status: { not: "ARCHIVED" } },
      select: { id: true, name: true, email: true, currency: true, paymentTerms: true },
      orderBy: { name: "asc" },
    }),
    db.product.findMany({
      where: { organizationId: orgId, isActive: true },
      select: { id: true, name: true, unitPrice: true, unit: true, description: true },
      orderBy: { name: "asc" },
    }),
    db.invoice.findFirst({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      select: { number: true },
    }),
  ])

  const nextNumber = generateNextNumber(lastInvoice?.number)

  return (
    <InvoiceBuilder
      clients={clients}
      defaultClientId={clientId}
      nextNumber={nextNumber}
      orgId={orgId}
      catalogItems={catalogItems.map((p) => ({ id: p.id, name: p.name, unitPrice: Number(p.unitPrice), unit: p.unit, description: p.description }))}
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
