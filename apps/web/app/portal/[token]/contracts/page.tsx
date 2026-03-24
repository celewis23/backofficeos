import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { formatDate } from "@/lib/utils"
import { FileSignature } from "lucide-react"

const STATUS_CLASS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-indigo-100 text-indigo-700",
  PARTIALLY_SIGNED: "bg-amber-100 text-amber-700",
  SIGNED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-muted text-muted-foreground",
  VOID: "bg-muted text-muted-foreground",
}

export default async function PortalContractsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const contracts = await db.contract.findMany({
    where: { clientId: portalToken.clientId, organizationId: portalToken.client.organizationId },
    include: { signers: { select: { id: true, name: true, email: true, signedAt: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Contracts</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
      </div>

      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <FileSignature className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No contracts yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileSignature className="size-4 text-muted-foreground shrink-0" />
                  <p className="text-sm font-semibold text-foreground">{contract.title}</p>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[contract.status] ?? "bg-muted text-muted-foreground"}`}>
                  {contract.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {contract.sentAt && <span>Sent {formatDate(contract.sentAt)}</span>}
                {contract.signedAt && <span>Signed {formatDate(contract.signedAt)}</span>}
                {contract.expiresAt && <span>Expires {formatDate(contract.expiresAt)}</span>}
              </div>

              {contract.signers.length > 0 && (
                <div className="space-y-1.5 pt-1 border-t border-border">
                  {contract.signers.map((signer) => (
                    <div key={signer.id} className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{signer.name} ({signer.email})</span>
                      <span className={`text-[10px] font-medium ${signer.signedAt ? "text-green-600" : "text-amber-600"}`}>
                        {signer.signedAt ? `Signed ${formatDate(signer.signedAt)}` : "Pending signature"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
