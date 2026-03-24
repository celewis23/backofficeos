import { db } from "@backoffice-os/database"
import { notFound } from "next/navigation"
import { FormRenderer } from "./form-renderer"

export default async function PublicFormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const form = await db.intakeForm.findFirst({
    where: { slug, isActive: true },
    include: {
      organization: { select: { name: true, logo: true } },
    },
  })

  if (!form) return notFound()

  const fields = form.fields as Array<{
    id: string
    type: string
    label: string
    required: boolean
    placeholder?: string
    options?: string[]
  }>

  return (
    <div className="min-h-screen bg-muted/30 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Org branding */}
        <div className="text-center mb-8">
          {form.organization.logo ? (
            <img src={form.organization.logo} alt={form.organization.name} className="h-10 mx-auto mb-3 object-contain" />
          ) : (
            <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg mb-3">
              {form.organization.name.charAt(0)}
            </div>
          )}
          <p className="text-xs text-muted-foreground">{form.organization.name}</p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-border bg-background shadow-sm">
          <div className="px-6 py-5 border-b border-border">
            <h1 className="text-lg font-semibold">{form.name}</h1>
            {form.description && (
              <p className="text-sm text-muted-foreground mt-1">{form.description}</p>
            )}
          </div>
          <div className="px-6 py-5">
            <FormRenderer formId={form.id} slug={slug} fields={fields} />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by ArcheionOS
        </p>
      </div>
    </div>
  )
}
