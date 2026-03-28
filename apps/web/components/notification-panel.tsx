"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Bell, X, Check, CheckCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUIStore } from "@/lib/stores/ui-store"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  readAt: string | null
  createdAt: string
}

const TYPE_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  INVOICE_OVERDUE: { icon: AlertCircle, color: "text-red-500" },
  INVOICE_PAID: { icon: Check, color: "text-green-500" },
  INVOICE_VIEWED: { icon: Check, color: "text-blue-500" },
  CONTRACT_SIGNED: { icon: Check, color: "text-green-500" },
  CONTRACT_DECLINED: { icon: AlertCircle, color: "text-red-500" },
  BOOKING_CONFIRMED: { icon: Check, color: "text-green-500" },
  BOOKING_CANCELLED: { icon: AlertCircle, color: "text-amber-500" },
  TASK_ASSIGNED: { icon: Bell, color: "text-blue-500" },
  TASK_DUE_SOON: { icon: AlertCircle, color: "text-amber-500" },
  LEAD_ASSIGNED: { icon: Bell, color: "text-purple-500" },
  MENTION: { icon: Bell, color: "text-blue-500" },
  TEAM_INVITE_ACCEPTED: { icon: Check, color: "text-green-500" },
}

function getEntityHref(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  const map: Record<string, string> = {
    invoice: `/billing/invoices/${entityId}`,
    contract: `/documents`,
    booking: `/scheduling`,
    task: `/projects`,
    lead: `/crm`,
    member: `/team`,
  }
  return map[entityType.toLowerCase()] ?? null
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function isToday(date: string) {
  const d = new Date(date)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen, setUnreadNotificationCount } = useUIStore()
  const router = useRouter()
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (!notificationPanelOpen) return
    setLoading(true)
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(({ notifications: data, unreadCount }) => {
        setNotifications(data ?? [])
        setUnreadNotificationCount(unreadCount ?? 0)
      })
      .finally(() => setLoading(false))
  }, [notificationPanelOpen, setUnreadNotificationCount])

  async function markRead(id: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
    setUnreadNotificationCount(notifications.filter((n) => !n.readAt && n.id !== id).length)
  }

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markAllRead: true }) })
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
    setUnreadNotificationCount(0)
  }

  function handleClick(n: Notification) {
    if (!n.readAt) markRead(n.id)
    const href = getEntityHref(n.entityType, n.entityId)
    if (href) { router.push(href); setNotificationPanelOpen(false) }
  }

  const todayItems = notifications.filter((n) => isToday(n.createdAt))
  const earlierItems = notifications.filter((n) => !isToday(n.createdAt))
  const unread = notifications.filter((n) => !n.readAt).length

  if (!notificationPanelOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        onClick={() => setNotificationPanelOpen(false)}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-full sm:w-96 border-l border-border bg-background shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unread > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={markAllRead}>
                <CheckCheck className="size-3.5" />
                Mark all read
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={() => setNotificationPanelOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Bell className="size-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium">You&apos;re all caught up</p>
              <p className="text-xs text-muted-foreground mt-1">Notifications will appear here</p>
            </div>
          ) : (
            <div className="py-2">
              {todayItems.length > 0 && (
                <div>
                  <p className="px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Today</p>
                  {todayItems.map((n) => <NotificationItem key={n.id} n={n} onClick={handleClick} onMarkRead={markRead} />)}
                </div>
              )}
              {earlierItems.length > 0 && (
                <div>
                  <p className="px-5 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Earlier</p>
                  {earlierItems.map((n) => <NotificationItem key={n.id} n={n} onClick={handleClick} onMarkRead={markRead} />)}
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </>
  )
}

function NotificationItem({
  n,
  onClick,
  onMarkRead,
}: {
  n: Notification
  onClick: (n: Notification) => void
  onMarkRead: (id: string) => void
}) {
  const config = TYPE_ICONS[n.type] ?? { icon: Bell, color: "text-muted-foreground" }
  const Icon = config.icon
  const isUnread = !n.readAt
  const isClickable = !!getEntityHref(n.entityType, n.entityId)

  return (
    <div
      className={cn(
        "group flex items-start gap-3 px-5 py-3.5 transition-colors",
        isUnread ? "bg-primary/5" : "",
        isClickable ? "cursor-pointer hover:bg-muted/50" : ""
      )}
      onClick={() => onClick(n)}
    >
      <div className={cn("size-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5", config.color)}>
        <Icon className="size-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm leading-snug", isUnread ? "font-medium text-foreground" : "text-foreground/80")}>
          {n.title}
        </p>
        {n.body && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>}
        <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(n.createdAt)}</p>
      </div>
      {isUnread && (
        <button
          className="size-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-all shrink-0"
          onClick={(e) => { e.stopPropagation(); onMarkRead(n.id) }}
          title="Mark as read"
        >
          <Check className="size-3 text-muted-foreground" />
        </button>
      )}
      {isUnread && (
        <span className="size-1.5 rounded-full bg-primary shrink-0 mt-2" />
      )}
    </div>
  )
}
