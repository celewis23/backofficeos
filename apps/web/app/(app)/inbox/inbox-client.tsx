"use client"

import * as React from "react"
import {
  Mail, Search, Archive, Star, RefreshCw, Plus,
  Inbox as InboxIcon, Send, Trash2, Tag, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn, formatRelativeTime, initials } from "@/lib/utils"
import type { Thread, Message, Client, EmailAccount } from "@backoffice-os/database"

type ThreadWithRelations = Thread & {
  client: Pick<Client, "id" | "name"> | null
  messages: { body: string; sentAt: Date; from: string | null }[]
  _count: { messages: number }
}

interface InboxClientProps {
  threads: ThreadWithRelations[]
  emailAccounts: Pick<EmailAccount, "id" | "email" | "name" | "provider">[]
}

export function InboxClient({ threads, emailAccounts }: InboxClientProps) {
  const [selected, setSelected] = React.useState<ThreadWithRelations | null>(null)
  const [search, setSearch] = React.useState("")

  const filtered = threads.filter(
    (t) =>
      search === "" ||
      t.subject?.toLowerCase().includes(search.toLowerCase()) ||
      t.client?.name.toLowerCase().includes(search.toLowerCase())
  )

  const unreadCount = threads.filter((t) => !t.isRead).length

  return (
    <div className="flex h-full">
      {/* Left panel: thread list */}
      <div className="w-80 border-r border-border flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <InboxIcon className="size-4 text-foreground" />
            <span className="font-semibold text-sm">Inbox</span>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-7">
              <RefreshCw className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="size-7">
              <Plus className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search..."
              className="pl-7 h-7 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {emailAccounts.length === 0 ? (
            <ConnectEmailPrompt />
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <InboxIcon className="size-8 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No messages</p>
            </div>
          ) : (
            filtered.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                selected={selected?.id === thread.id}
                onClick={() => setSelected(thread)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel: thread detail */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <ThreadDetail thread={selected} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Mail className="size-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a thread from the left to read and reply
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ThreadRow({
  thread,
  selected,
  onClick,
}: {
  thread: ThreadWithRelations
  selected: boolean
  onClick: () => void
}) {
  const lastMessage = thread.messages[0]
  const preview = lastMessage?.body.replace(/<[^>]+>/g, "").slice(0, 80) ?? ""

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 px-3 py-2.5 cursor-pointer border-b border-border/50 hover:bg-muted/40 transition-colors",
        selected && "bg-muted",
        !thread.isRead && "bg-primary/5"
      )}
      onClick={onClick}
    >
      <Avatar className="size-8 mt-0.5 shrink-0">
        <AvatarFallback className="text-[10px] bg-muted">
          {thread.client ? initials(thread.client.name) : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("text-xs font-medium truncate", !thread.isRead && "font-semibold")}>
            {thread.client?.name ?? lastMessage?.from ?? "Unknown"}
          </span>
          {thread.lastMessageAt && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              {formatRelativeTime(thread.lastMessageAt)}
            </span>
          )}
        </div>
        {thread.subject && (
          <p className={cn("text-xs truncate", !thread.isRead ? "text-foreground font-medium" : "text-muted-foreground")}>
            {thread.subject}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{preview}</p>
      </div>
    </div>
  )
}

function ThreadDetail({ thread }: { thread: ThreadWithRelations }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h2 className="font-semibold text-base">{thread.subject ?? "(No subject)"}</h2>
          {thread.client && (
            <p className="text-xs text-muted-foreground mt-0.5">{thread.client.name}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8">
            <Archive className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <p className="text-sm text-muted-foreground text-center">Loading messages...</p>
      </div>

      {/* Reply box */}
      <div className="border-t border-border p-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <textarea
            className="w-full bg-transparent text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground"
            placeholder="Reply..."
            rows={3}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7">
                <Tag className="size-3.5" />
              </Button>
            </div>
            <Button size="sm" className="gap-1.5">
              <Send className="size-3.5" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConnectEmailPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
        <Mail className="size-6 text-primary" />
      </div>
      <p className="text-sm font-semibold">Connect your email</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4 leading-relaxed">
        Connect Google Workspace or Microsoft 365 to see all your emails in one place.
      </p>
      <Button size="sm" variant="outline">Connect email</Button>
    </div>
  )
}
