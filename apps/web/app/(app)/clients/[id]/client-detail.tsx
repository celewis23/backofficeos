"use client"

import * as React from "react"
import Link from "next/link"
import {
  Building2, Mail, Phone, Globe, MapPin, Tag, Plus,
  FileText, FolderKanban, Clock, MessageSquare, ArrowLeft,
  MoreHorizontal, Edit2, Trash2, Users, ChevronRight, Link2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { formatCurrency, formatDate, initials } from "@/lib/utils"
import type { Client, Contact, Invoice, Project, ClientActivity, ClientTag, Tag as TagModel, InvoiceStatus, ProjectStatus } from "@backoffice-os/database"

type ClientWithRelations = Client & {
  contacts: Contact[]
  invoices: (Invoice & { _?: unknown })[]
  projects: Project[]
  activities: ClientActivity[]
  tags: (ClientTag & { tag: TagModel })[]
}

const INVOICE_STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  VIEWED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
  PARTIAL: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  VOID: "bg-muted text-muted-foreground",
  UNCOLLECTIBLE: "bg-muted text-muted-foreground",
}

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  ON_HOLD: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  COMPLETED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ARCHIVED: "bg-muted text-muted-foreground",
}

export function ClientDetail({ client }: { client: ClientWithRelations }) {
  const [sendingPortal, setSendingPortal] = React.useState(false)

  async function handleSendPortalLink() {
    setSendingPortal(true)
    try {
      const res = await fetch("/api/portal/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      })
      const data = await res.json()
      if (data.portalUrl) {
        await navigator.clipboard.writeText(data.portalUrl)
        toast.success("Portal link copied to clipboard")
      } else {
        toast.error(data.error ?? "Failed to generate portal link")
      }
    } finally {
      setSendingPortal(false)
    }
  }

  const totalBilled = client.invoices.reduce((sum, inv) => sum + Number(inv.total), 0)
  const totalPaid = client.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + Number(inv.total), 0)
  const outstanding = totalBilled - totalPaid

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <Link href="/clients">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <Avatar className="size-10">
          <AvatarImage src={client.avatar ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {initials(client.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground truncate">{client.name}</h1>
            <Badge variant="outline" className="text-[10px]">{client.status}</Badge>
          </div>
          {client.industry && (
            <p className="text-sm text-muted-foreground">{client.industry}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSendPortalLink} disabled={sendingPortal}>
            <Link2 className="size-3.5" />
            {sendingPortal ? "Generating..." : "Portal link"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="size-3.5" />
            New invoice
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FolderKanban className="size-3.5" />
            New project
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r border-border overflow-y-auto shrink-0 p-4 space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Billed</p>
              <p className="text-base font-semibold text-foreground mt-0.5">{formatCurrency(totalBilled)}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Outstanding</p>
              <p className={`text-base font-semibold mt-0.5 ${outstanding > 0 ? "text-destructive" : "text-foreground"}`}>
                {formatCurrency(outstanding)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-2.5">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Contact</p>
            {client.email && (
              <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary group">
                <Mail className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
            )}
            {client.phone && (
              <a href={`tel:${client.phone}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary group">
                <Phone className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                {client.phone}
              </a>
            )}
            {client.website && (
              <a href={client.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary group">
                <Globe className="size-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                <span className="truncate">{client.website.replace(/^https?:\/\//, "")}</span>
              </a>
            )}
            {!client.email && !client.phone && !client.website && (
              <p className="text-xs text-muted-foreground">No contact info</p>
            )}
          </div>

          {/* Tags */}
          {client.tags.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {client.tags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground"
                    >
                      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color }} />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Contacts */}
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">Contacts</p>
              <Button variant="ghost" size="icon" className="size-5">
                <Plus className="size-3" />
              </Button>
            </div>
            {client.contacts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No contacts</p>
            ) : (
              <div className="space-y-2">
                {client.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-center gap-2">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {initials(`${contact.firstName} ${contact.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {contact.firstName} {contact.lastName}
                        {contact.isPrimary && <span className="text-muted-foreground font-normal"> · Primary</span>}
                      </p>
                      {contact.jobTitle && (
                        <p className="text-[11px] text-muted-foreground truncate">{contact.jobTitle}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Metadata */}
          <Separator />
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Created</span>
              <span>{formatDate(client.createdAt)}</span>
            </div>
            {client.paymentTerms && (
              <div className="flex justify-between">
                <span>Payment terms</span>
                <span>Net {client.paymentTerms}</span>
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="activity">
            <TabsList className="mb-6">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({client.invoices.length})</TabsTrigger>
              <TabsTrigger value="projects">Projects ({client.projects.length})</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="activity">
              <ActivityFeed activities={client.activities} />
            </TabsContent>

            <TabsContent value="invoices">
              <InvoiceList invoices={client.invoices} clientId={client.id} />
            </TabsContent>

            <TabsContent value="projects">
              <ProjectList projects={client.projects} clientId={client.id} />
            </TabsContent>

            <TabsContent value="notes">
              <div className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes || "No notes yet. Add a note about this client."}
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

function ActivityFeed({ activities }: { activities: ClientActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Clock className="size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 py-3 border-b border-border last:border-0">
          <div className="size-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-xs">📋</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">{activity.title}</p>
            {activity.body && (
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{activity.body}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{formatDate(activity.createdAt)}</span>
        </div>
      ))}
    </div>
  )
}

function InvoiceList({ invoices, clientId }: { invoices: Invoice[]; clientId: string }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No invoices yet</p>
        <Link href={`/billing/invoices/new?clientId=${clientId}`}>
          <Button size="sm" variant="outline">Create invoice</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {invoices.map((invoice) => (
        <Link key={invoice.id} href={`/billing/invoices/${invoice.id}`}>
          <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{invoice.number}</p>
              <p className="text-xs text-muted-foreground">{formatDate(invoice.issueDate)}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${INVOICE_STATUS_COLORS[invoice.status]}`}>
              {invoice.status}
            </span>
            <p className="text-sm font-semibold text-foreground w-24 text-right">
              {formatCurrency(Number(invoice.total))}
            </p>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}

function ProjectList({ projects, clientId }: { projects: Project[]; clientId: string }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FolderKanban className="size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm text-muted-foreground mb-3">No projects yet</p>
        <Link href={`/projects/new?clientId=${clientId}`}>
          <Button size="sm" variant="outline">Create project</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="divide-y divide-border rounded-lg border border-border overflow-hidden">
      {projects.map((project) => (
        <Link key={project.id} href={`/projects/${project.id}`}>
          <div className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors">
            <div
              className="size-2.5 rounded-full shrink-0"
              style={{ backgroundColor: project.color ?? "#6366f1" }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{project.name}</p>
              {project.dueDate && (
                <p className="text-xs text-muted-foreground">Due {formatDate(project.dueDate)}</p>
              )}
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PROJECT_STATUS_COLORS[project.status]}`}>
              {project.status.replace("_", " ")}
            </span>
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}
