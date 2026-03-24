import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { notFound } from "next/navigation"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { format } from "date-fns"

export default async function FormSubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { orgId } = await requireOrg()
  const { id } = await params

  const form = await db.intakeForm.findFirst({
    where: { id, organizationId: orgId },
    include: {
      submissions: { orderBy: { submittedAt: "desc" } },
    },
  })

  if (!form) return notFound()

  const fields = form.fields as Array<{ id: string; label: string; type: string }>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
        <Link href="/intake-forms" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-sm font-semibold">{form.name} — Submissions</h1>
          <p className="text-xs text-muted-foreground">{form.submissions.length} response{form.submissions.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        {form.submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <p className="text-sm font-medium">No submissions yet</p>
            <p className="text-xs text-muted-foreground mt-1">Share your form link to collect responses</p>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {form.submissions.map((sub) => {
              const data = sub.data as Record<string, string>
              return (
                <div key={sub.id} className="rounded-lg border border-border p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(sub.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                    {sub.ipAddress && (
                      <Badge variant="secondary" className="text-[10px]">{sub.ipAddress}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {fields.map((field) => (
                      <div key={field.id}>
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{field.label}</p>
                        <p className="text-sm mt-0.5">{data[field.id] ?? "—"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
