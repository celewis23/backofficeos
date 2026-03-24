import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { formatDate } from "@/lib/utils"
import { FolderOpen, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function PortalFilesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const files = await db.file.findMany({
    where: { clientId: portalToken.clientId, organizationId: portalToken.client.organizationId },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Files</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{files.length} file{files.length !== 1 ? "s" : ""}</p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <FolderOpen className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No files shared yet</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="size-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)} · {formatDate(file.createdAt)}</p>
                </div>
              </div>
              {file.url && (
                <a href={file.url} target="_blank" rel="noopener noreferrer" download>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs shrink-0">
                    <Download className="size-3.5" />
                    Download
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
