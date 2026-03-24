"use client"

import * as React from "react"
import {
  FileText, FilePen, File, Plus, Search, FolderOpen,
  Download, MoreHorizontal, PenLine, CheckCircle2, Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { formatDate, cn } from "@/lib/utils"
import type { Document, Contract, ContractSigner, Client, File as FileModel, ContractStatus } from "@backoffice-os/database"

type ContractWithRelations = Contract & {
  client: Pick<Client, "name"> | null
  signers: ContractSigner[]
}

const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; class: string; icon: React.ElementType }> = {
  DRAFT: { label: "Draft", class: "bg-muted text-muted-foreground", icon: FileText },
  SENT: { label: "Sent", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Clock },
  VIEWED: { label: "Viewed", class: "bg-indigo-100 text-indigo-700", icon: Clock },
  PARTIALLY_SIGNED: { label: "Partial", class: "bg-amber-100 text-amber-700", icon: PenLine },
  SIGNED: { label: "Signed", class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  DECLINED: { label: "Declined", class: "bg-red-100 text-red-700", icon: AlertCircle },
  EXPIRED: { label: "Expired", class: "bg-muted text-muted-foreground", icon: Clock },
  VOID: { label: "Void", class: "bg-muted text-muted-foreground", icon: AlertCircle },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentsClientProps {
  documents: Document[]
  contracts: ContractWithRelations[]
  files: FileModel[]
}

export function DocumentsClient({ documents, contracts, files }: DocumentsClientProps) {
  const [search, setSearch] = React.useState("")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <h1 className="text-lg font-semibold">Documents</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5">
            <FilePen className="size-3.5" />
            New contract
          </Button>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New document
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search documents..."
            className="pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="docs" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-3 w-fit">
            <TabsTrigger value="docs">Documents ({documents.length})</TabsTrigger>
            <TabsTrigger value="contracts">Contracts ({contracts.length})</TabsTrigger>
            <TabsTrigger value="files">Files ({files.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="docs" className="flex-1 overflow-auto px-6 py-4">
            {documents.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents"
                description="Create proposals, SOPs, meeting notes, and more."
                action="New document"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg border border-border p-4 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <FileText className="size-5 text-primary shrink-0 mt-0.5" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </Button>
                    </div>
                    <p className="font-medium text-sm mt-2 truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(doc.updatedAt)}</p>
                    <Badge variant="outline" className="text-[10px] mt-2">
                      {doc.type.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contracts" className="flex-1 overflow-auto px-6 py-4">
            {contracts.length === 0 ? (
              <EmptyState
                icon={FilePen}
                title="No contracts"
                description="Build contracts with e-signature — no third-party required."
                action="New contract"
              />
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {contracts.map((contract) => {
                  const status = CONTRACT_STATUS_CONFIG[contract.status]
                  const StatusIcon = status.icon
                  const signedCount = contract.signers.filter((s) => s.signedAt).length

                  return (
                    <div
                      key={contract.id}
                      className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <FilePen className="size-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{contract.title}</p>
                        {contract.client && (
                          <p className="text-xs text-muted-foreground">{contract.client.name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className="size-3" />
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.class}`}>
                          {status.label}
                        </span>
                      </div>
                      {contract.signers.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {signedCount}/{contract.signers.length} signed
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{formatDate(contract.createdAt)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="files" className="flex-1 overflow-auto px-6 py-4">
            {files.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                title="No files"
                description="Upload and organize files for clients and projects."
                action="Upload files"
              />
            ) : (
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-muted/40 cursor-pointer transition-colors group"
                  >
                    <File className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.originalName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(file.createdAt)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: React.ElementType
  title: string
  description: string
  action: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="size-7 text-primary" />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">{description}</p>
      <Button size="sm" variant="outline" className="gap-1.5">
        <Plus className="size-3.5" />
        {action}
      </Button>
    </div>
  )
}
