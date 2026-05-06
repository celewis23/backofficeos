"use client"

import * as React from "react"
import {
  Mail,
  Search,
  Archive,
  RefreshCw,
  Send,
  Inbox as InboxIcon,
  Trash2,
  ChevronLeft,
  Reply,
  FileText,
  AlertCircle,
  MailOpen,
  Menu,
  Settings,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn, initials } from "@/lib/utils"
import type { Thread, Client, EmailAccount } from "@backoffice-os/database"

type ThreadWithRelations = Thread & {
  client: Pick<Client, "id" | "name"> | null
  messages: { body: string; sentAt: Date; from: string | null }[]
  _count: { messages: number }
}

type MessageData = {
  id: string
  from: string | null
  to: string[]
  cc: string[]
  body: string
  htmlBody: string | null
  sentAt: string
  isRead: boolean
}

type Folder = "inbox" | "archive" | "drafts" | "sent" | "junk" | "spam" | "trash"

const FOLDERS: { id: Folder; label: string; icon: React.ElementType }[] = [
  { id: "inbox", label: "Inbox", icon: InboxIcon },
  { id: "archive", label: "Archive", icon: Archive },
  { id: "drafts", label: "Drafts", icon: FileText },
  { id: "sent", label: "Sent", icon: Send },
  { id: "junk", label: "Junk", icon: AlertCircle },
  { id: "spam", label: "Spam", icon: AlertCircle },
  { id: "trash", label: "Trash", icon: Trash2 },
]

interface InboxClientProps {
  threads: ThreadWithRelations[]
  emailAccounts: Pick<EmailAccount, "id" | "email" | "name" | "provider">[]
}

export function InboxClient({ threads, emailAccounts }: InboxClientProps) {
  const [folder, setFolder] = React.useState<Folder>("inbox")
  const [selected, setSelected] = React.useState<ThreadWithRelations | null>(null)
  const [search, setSearch] = React.useState("")
  const [navExpanded, setNavExpanded] = React.useState(true)
  const [messages, setMessages] = React.useState<MessageData[]>([])
  const [loadingMessages, setLoadingMessages] = React.useState(false)
  const [mobileView, setMobileView] = React.useState<"list" | "thread">("list")

  const filteredThreads = React.useMemo(() => {
    let base = threads
    if (folder === "inbox") base = base.filter((t) => !t.isArchived)
    else if (folder === "archive") base = base.filter((t) => t.isArchived)
    else base = []

    if (search) {
      const q = search.toLowerCase()
      base = base.filter(
        (t) =>
          t.subject?.toLowerCase().includes(q) ||
          t.client?.name.toLowerCase().includes(q) ||
          t.messages[0]?.from?.toLowerCase().includes(q),
      )
    }
    return base
  }, [threads, folder, search])

  const inboxCount = threads.filter((t) => !t.isArchived).length
  const archiveCount = threads.filter((t) => t.isArchived).length
  const inboxUnread = threads.filter((t) => !t.isArchived && !t.isRead).length

  function folderCount(f: Folder) {
    if (f === "inbox") return inboxCount
    if (f === "archive") return archiveCount
    return 0
  }

  async function openThread(thread: ThreadWithRelations) {
    setSelected(thread)
    setMobileView("thread")
    setMessages([])
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/inbox/${thread.id}/messages`)
      if (res.ok) setMessages(await res.json())
    } finally {
      setLoadingMessages(false)
    }
  }

  function closeThread() {
    setSelected(null)
    setMobileView("list")
    setMessages([])
  }

  function switchFolder(f: Folder) {
    setFolder(f)
    setSelected(null)
    setMessages([])
    setMobileView("list")
  }

  const primaryAccount = emailAccounts[0]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Page header ── */}
      <div
        className={cn(
          "flex items-center justify-between px-6 py-4 border-b border-border shrink-0",
          mobileView === "thread" && "hidden md:flex",
        )}
      >
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email Inbox</h1>
          {primaryAccount && (
            <p className="text-sm text-muted-foreground mt-0.5">{primaryAccount.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-8">
            <RefreshCw className="size-4" />
          </Button>
          <Button size="sm" className="gap-1.5">
            <Pencil className="size-3.5" />
            Compose
          </Button>
          <Button variant="ghost" size="icon" className="size-8">
            <Settings className="size-4" />
          </Button>
        </div>
      </div>

      {/* ── 3-panel area ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop folder nav — collapsible */}
        <div
          className={cn(
            "hidden md:flex flex-col border-r border-border bg-muted/20 shrink-0 transition-all duration-200",
            navExpanded ? "w-52" : "w-12",
          )}
        >
          <div
            className={cn(
              "flex items-center border-b border-border h-10 shrink-0 px-2",
              navExpanded ? "justify-between" : "justify-center",
            )}
          >
            {navExpanded && (
              <span className="text-[11px] font-medium text-muted-foreground pl-1 uppercase tracking-wide">
                Folders
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => setNavExpanded((v) => !v)}
            >
              <Menu className="size-3.5" />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
            {FOLDERS.map(({ id, label, icon: Icon }) => {
              const count = folderCount(id)
              const unread = id === "inbox" ? inboxUnread : 0
              const active = folder === id
              return (
                <button
                  key={id}
                  onClick={() => switchFolder(id)}
                  className={cn(
                    "w-full flex items-center rounded-md text-sm transition-colors",
                    navExpanded ? "gap-2.5 px-2.5 py-1.5" : "justify-center py-2",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  <Icon className="size-3.5 shrink-0" />
                  {navExpanded && (
                    <>
                      <span className="flex-1 text-left truncate">{label}</span>
                      {unread > 0 && (
                        <span
                          className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none",
                            active
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-primary text-primary-foreground",
                          )}
                        >
                          {unread}
                        </span>
                      )}
                      {unread === 0 && count > 0 && (
                        <span
                          className={cn(
                            "text-[10px] tabular-nums",
                            active ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Mobile folder icon strip */}
        <div
          className={cn(
            "md:hidden flex flex-col border-r border-border bg-muted/20 shrink-0 w-11",
            mobileView === "thread" && "hidden",
          )}
        >
          <div className="flex items-center justify-center h-10 border-b border-border">
            <Menu className="size-3.5 text-muted-foreground" />
          </div>
          <nav className="flex-1 overflow-y-auto py-1.5 flex flex-col items-center gap-0.5">
            {FOLDERS.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchFolder(id)}
                className={cn(
                  "size-8 flex items-center justify-center rounded-md transition-colors",
                  folder === id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </nav>
        </div>

        {/* Thread list */}
        <div
          className={cn(
            "flex flex-col border-r border-border shrink-0",
            "md:w-80 lg:w-96",
            mobileView === "thread" ? "hidden md:flex" : "flex-1 md:flex-none",
          )}
        >
          <div className="flex items-center gap-2 px-4 h-10 border-b border-border shrink-0">
            <span className="font-medium text-sm capitalize">{folder}</span>
            <span className="text-xs text-muted-foreground">
              {filteredThreads.length} messages
            </span>
          </div>

          <div className="px-3 py-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search sender or subject"
                className="pl-7 h-7 text-xs"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {emailAccounts.length === 0 ? (
              <ConnectEmailPrompt />
            ) : filteredThreads.length === 0 ? (
              <EmptyState folder={folder} />
            ) : (
              filteredThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  selected={selected?.id === thread.id}
                  onClick={() => openThread(thread)}
                />
              ))
            )}
          </div>
        </div>

        {/* Email view */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            mobileView === "list" && "hidden md:flex",
          )}
        >
          {selected ? (
            <ThreadDetail
              thread={selected}
              messages={messages}
              loading={loadingMessages}
              onBack={closeThread}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="size-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <Mail className="size-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium">No message selected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Choose a message to read it here
                </p>
              </div>
            </div>
          )}
        </div>
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
  const lastMsg = thread.messages[0]
  const preview = lastMsg?.body.replace(/<[^>]+>/g, "").slice(0, 100) ?? ""
  const sender = thread.client?.name ?? lastMsg?.from ?? "Unknown"
  const date = thread.lastMessageAt
    ? new Date(thread.lastMessageAt).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      })
    : ""

  return (
    <button
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 hover:bg-muted/40 transition-colors",
        selected && "bg-muted hover:bg-muted",
      )}
      onClick={onClick}
    >
      {/* Unread dot */}
      <div className="mt-1.5 shrink-0 w-2">
        {!thread.isRead && <div className="size-2 rounded-full bg-primary" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "text-sm truncate",
              !thread.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80",
            )}
          >
            {sender}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">{date}</span>
        </div>
        <p
          className={cn(
            "text-xs truncate mt-0.5",
            !thread.isRead ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {thread.subject ?? "(No subject)"}
        </p>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{preview}</p>
      </div>
    </button>
  )
}

function ThreadDetail({
  thread,
  messages,
  loading,
  onBack,
}: {
  thread: ThreadWithRelations
  messages: MessageData[]
  loading: boolean
  onBack: () => void
}) {
  const lastMsg = messages[messages.length - 1]

  return (
    <div className="flex flex-col h-full">
      {/* Action bar */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border shrink-0">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-8 md:hidden" onClick={onBack}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs px-2.5">
            <Reply className="size-3" />
            Reply
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs px-2.5">
            <MailOpen className="size-3" />
            Unread
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs px-2.5">
            <Archive className="size-3" />
            Archive
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 px-2.5"
        >
          <Trash2 className="size-3" />
          Delete
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
          </div>
        ) : (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-xl font-semibold tracking-tight mb-3">
              {thread.subject ?? "(No subject)"}
            </h1>

            {lastMsg && (
              <div className="text-xs space-y-1 mb-6 pb-6 border-b border-border">
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">From:</span> {lastMsg.from}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">To:</span>{" "}
                  {lastMsg.to.join(", ")}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">Date:</span>{" "}
                  {new Date(lastMsg.sentAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            )}

            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages in this thread.</p>
            ) : (
              <div className="space-y-8">
                {messages.map((msg) => (
                  <EmailMessage key={msg.id} message={msg} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmailMessage({ message }: { message: MessageData }) {
  const frameRef = React.useRef<HTMLIFrameElement>(null)

  function onLoad() {
    const frame = frameRef.current
    if (!frame?.contentDocument?.documentElement) return
    frame.style.height = frame.contentDocument.documentElement.scrollHeight + "px"
  }

  if (message.htmlBody) {
    return (
      <iframe
        ref={frameRef}
        srcDoc={message.htmlBody}
        className="w-full border-none block"
        style={{ minHeight: 200 }}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        onLoad={onLoad}
        title="Email message"
      />
    )
  }

  return (
    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{message.body}</p>
  )
}

function EmptyState({ folder }: { folder: Folder }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      <InboxIcon className="size-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">
        {folder === "inbox" ? "Your inbox is empty" : `No messages in ${folder}`}
      </p>
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
      <Button size="sm" variant="outline">
        Connect email
      </Button>
    </div>
  )
}
