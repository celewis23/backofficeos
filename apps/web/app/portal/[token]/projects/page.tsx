import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { Folders } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active", ON_HOLD: "On Hold", COMPLETED: "Completed",
  CANCELLED: "Cancelled", ARCHIVED: "Archived",
}
const STATUS_CLASS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ON_HOLD: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-muted text-muted-foreground",
  ARCHIVED: "bg-muted text-muted-foreground",
}

export default async function PortalProjectsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const projects = await db.project.findMany({
    where: { clientId: portalToken.clientId, organizationId: portalToken.client.organizationId },
    include: {
      tasks: {
        select: { id: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{projects.length} project{projects.length !== 1 ? "s" : ""}</p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <Folders className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No projects yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const total = project.tasks.length
            const done = project.tasks.filter((t) => t.status === "DONE").length
            const progress = total > 0 ? Math.round((done / total) * 100) : 0

            return (
              <div key={project.id} className="border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${STATUS_CLASS[project.status] ?? "bg-muted text-muted-foreground"}`}>
                    {STATUS_LABELS[project.status] ?? project.status}
                  </span>
                </div>

                {total > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{done} of {total} tasks complete</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
