"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, ClipboardList, Copy, Trash2, Eye, ToggleLeft, ExternalLink, GripVertical, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { createForm, deleteForm, toggleForm } from "./actions"
import Link from "next/link"

type FormField = {
  id: string
  type: "text" | "textarea" | "email" | "phone" | "number" | "date" | "select" | "checkbox" | "radio"
  label: string
  required: boolean
  placeholder?: string
  options?: string[]
}

type IntakeForm = {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdAt: string
  _count: { submissions: number }
}

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown" },
  { value: "radio", label: "Multiple choice" },
  { value: "checkbox", label: "Checkbox" },
]

function generateId() { return Math.random().toString(36).slice(2, 9) }
function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }

export function IntakeFormsClient({ forms: initial }: { forms: IntakeForm[] }) {
  const [forms, setForms] = React.useState(initial)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [notifyEmail, setNotifyEmail] = React.useState("")
  const [fields, setFields] = React.useState<FormField[]>([
    { id: generateId(), type: "text", label: "Full Name", required: true },
    { id: generateId(), type: "email", label: "Email Address", required: true },
  ])

  function addField() {
    setFields((prev) => [...prev, { id: generateId(), type: "text", label: "New Field", required: false }])
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  function updateField(id: string, patch: Partial<FormField>) {
    setFields((prev) => prev.map((f) => f.id === id ? { ...f, ...patch } : f))
  }

  async function handleSave() {
    setSaving(true)
    const result = await createForm({ name, slug, description, fields, notifyEmail })
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success("Form created")
    setDialogOpen(false)
    window.location.reload()
  }

  async function handleDelete(id: string) {
    await deleteForm(id)
    setForms((prev) => prev.filter((f) => f.id !== id))
    toast.success("Form deleted")
  }

  async function handleToggle(id: string, current: boolean) {
    await toggleForm(id, !current)
    setForms((prev) => prev.map((f) => f.id === id ? { ...f, isActive: !current } : f))
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/forms/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold">Intake Forms</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Build and share forms to collect client information</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="size-3.5" /> New Form
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <ClipboardList className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No forms yet</p>
            <p className="text-xs text-muted-foreground mt-1">Create your first intake form to share with clients</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={() => setDialogOpen(true)}>
              <Plus className="size-3.5" /> New Form
            </Button>
          </div>
        ) : (
          <div className="p-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <div key={form.id} className="rounded-lg border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{form.name}</p>
                    {form.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{form.description}</p>
                    )}
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={() => handleToggle(form.id, form.isActive)}
                    className="scale-75 shrink-0"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">{form._count.submissions} responses</Badge>
                  <Badge variant={form.isActive ? "default" : "outline"} className="text-[10px]">
                    {form.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 pt-1 border-t border-border">
                  <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs gap-1" asChild>
                    <Link href={`/intake-forms/${form.id}`}>
                      <Eye className="size-3" /> Submissions
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon-sm" onClick={() => copyLink(form.slug)}>
                    <Copy className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon-sm" asChild>
                    <a href={`/forms/${form.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3.5" />
                    </a>
                  </Button>
                  <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(form.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Create Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Create Intake Form</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="shrink-0">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="fields">Fields ({fields.length})</TabsTrigger>
            </TabsList>
            <ScrollArea className="flex-1">
              <TabsContent value="details" className="p-1 space-y-4">
                <div className="space-y-1.5">
                  <Label>Form name</Label>
                  <Input
                    placeholder="e.g. New Client Onboarding"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (!slug || slug === slugify(name)) setSlug(slugify(e.target.value)) }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>URL slug</Label>
                  <div className="flex items-center">
                    <span className="h-9 flex items-center px-3 text-xs text-muted-foreground bg-muted rounded-l-md border border-r-0 border-input">
                      /forms/
                    </span>
                    <Input
                      className="rounded-l-none"
                      placeholder="new-client-onboarding"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                  <Input placeholder="Brief description shown to respondents" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Notify email <span className="text-muted-foreground">(optional)</span></Label>
                  <Input type="email" placeholder="you@example.com" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Receive an email when a new response is submitted</p>
                </div>
              </TabsContent>
              <TabsContent value="fields" className="p-1 space-y-3">
                {fields.map((field, i) => (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground shrink-0" />
                      <Input
                        className="h-7 text-xs flex-1"
                        value={field.label}
                        onChange={(e) => updateField(field.id, { label: e.target.value })}
                      />
                      <Select value={field.type} onValueChange={(v) => updateField(field.id, { type: v as FormField["type"] })}>
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">Required</span>
                        <Switch
                          checked={field.required}
                          onCheckedChange={(v) => updateField(field.id, { required: v })}
                          className="scale-75"
                        />
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => removeField(field.id)} disabled={fields.length <= 1}>
                        <X className="size-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                    {(field.type === "select" || field.type === "radio") && (
                      <div className="pl-6 space-y-1">
                        <p className="text-[10px] text-muted-foreground">Options (one per line)</p>
                        <textarea
                          className="w-full text-xs rounded-md border border-input bg-background px-3 py-2 min-h-16 resize-none"
                          placeholder="Option 1&#10;Option 2&#10;Option 3"
                          value={field.options?.join("\n") ?? ""}
                          onChange={(e) => updateField(field.id, { options: e.target.value.split("\n").filter(Boolean) })}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full text-xs" onClick={addField}>
                  <Plus className="size-3.5 mr-1.5" /> Add field
                </Button>
              </TabsContent>
            </ScrollArea>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t border-border shrink-0">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !name || !slug || fields.length === 0}>
              {saving ? "Creating..." : "Create Form"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
