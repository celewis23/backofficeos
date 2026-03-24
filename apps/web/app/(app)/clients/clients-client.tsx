"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  FolderKanban,
  FileText,
  Users,
  ChevronDown,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, initials } from "@/lib/utils"
import { NewClientDialog } from "./new-client-dialog"
import type { Client, ClientStatus } from "@backoffice-os/database"

type ClientWithCount = Client & {
  _count: { invoices: number; projects: number; contacts: number }
}

const STATUS_CONFIG: Record<ClientStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ACTIVE: { label: "Active", variant: "default" },
  INACTIVE: { label: "Inactive", variant: "secondary" },
  PROSPECT: { label: "Prospect", variant: "outline" },
  ARCHIVED: { label: "Archived", variant: "destructive" },
}

interface ClientsClientProps {
  clients: ClientWithCount[]
}

export function ClientsClient({ clients }: ClientsClientProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("all")
  const [newClientOpen, setNewClientOpen] = React.useState(false)

  const filtered = clients.filter((c) => {
    const matchesSearch =
      search === "" ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = 0 // would come from invoice aggregation

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Clients</h1>
            <p className="text-sm text-muted-foreground">
              {clients.length} {clients.length === 1 ? "client" : "clients"}
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setNewClientOpen(true)}>
            <Plus className="size-3.5" />
            New client
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search clients..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PROSPECT">Prospect</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {filtered.length === 0 ? (
            <EmptyState
              hasClients={clients.length > 0}
              onNewClient={() => setNewClientOpen(true)}
            />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((client) => (
                <ClientRow
                  key={client.id}
                  client={client}
                  onClick={() => router.push(`/clients/${client.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NewClientDialog open={newClientOpen} onOpenChange={setNewClientOpen} />
    </>
  )
}

function ClientRow({
  client,
  onClick,
}: {
  client: ClientWithCount
  onClick: () => void
}) {
  const status = STATUS_CONFIG[client.status]

  return (
    <div
      className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted/40 cursor-pointer group transition-colors"
      onClick={onClick}
    >
      <Avatar className="size-9 shrink-0">
        <AvatarImage src={client.avatar ?? undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
          {initials(client.name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground truncate">{client.name}</span>
          <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 h-4 shrink-0">
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          {client.email && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
              <Mail className="size-3 shrink-0" />
              {client.email}
            </span>
          )}
          {client.industry && (
            <span className="text-xs text-muted-foreground hidden sm:block">{client.industry}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6 shrink-0 text-xs text-muted-foreground">
        <span className="hidden lg:flex items-center gap-1">
          <FileText className="size-3" />
          {client._count.invoices} invoices
        </span>
        <span className="hidden lg:flex items-center gap-1">
          <FolderKanban className="size-3" />
          {client._count.projects} projects
        </span>
        <span className="hidden md:flex items-center gap-1">
          <Users className="size-3" />
          {client._count.contacts} contacts
        </span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${client.email}` }}
        >
          <Mail className="size-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick() }}>
              <ArrowUpRight className="size-3.5 mr-2" />
              Open
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <FileText className="size-3.5 mr-2" />
              New invoice
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <FolderKanban className="size-3.5 mr-2" />
              New project
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => e.stopPropagation()}
            >
              Archive client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

function EmptyState({
  hasClients,
  onNewClient,
}: {
  hasClients: boolean
  onNewClient: () => void
}) {
  if (hasClients) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Search className="size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium text-foreground">No clients found</p>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Building2 className="size-7 text-primary" />
      </div>
      <p className="text-sm font-semibold text-foreground">No clients yet</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
        Add your first client to start managing relationships, invoices, and projects in one place.
      </p>
      <Button size="sm" className="gap-1.5" onClick={onNewClient}>
        <Plus className="size-3.5" />
        Add your first client
      </Button>
    </div>
  )
}
