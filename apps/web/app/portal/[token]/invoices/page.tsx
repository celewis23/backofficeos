import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VIEWED: "bg-indigo-100 text-indigo-700",
  PARTIAL: "bg-amber-100 text-amber-700",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VOID: "bg-muted text-muted-foreground",
}

export default async function PortalInvoicesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const invoices = await db.invoice.findMany({
    where: { clientId: portalToken.clientId, organizationId: portalToken.client.organizationId },
    include: { items: { select: { id: true, description: true, quantity: true, unitPrice: true, amount: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
      </div>

      {invoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <FileText className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No invoices yet</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30">
            <span>Invoice</span>
            <span>Issued</span>
            <span>Due</span>
            <span className="text-right">Amount</span>
          </div>
          {invoices.map((inv) => (
            <div key={inv.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-3.5 items-center border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium">{inv.number}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_CLASS[inv.status] ?? "bg-muted text-muted-foreground"}`}>
                  {inv.status}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">{formatDate(inv.issueDate)}</span>
              <span className={`text-sm ${inv.status === "OVERDUE" ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                {inv.dueDate ? formatDate(inv.dueDate) : "—"}
              </span>
              <span className="text-sm font-semibold text-right">{formatCurrency(Number(inv.total))}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
