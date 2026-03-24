"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Plus, Calendar, Clock, Link2, ToggleLeft, ToggleRight,
  Copy, CheckCircle2, XCircle, MoreHorizontal, Users2,
  ExternalLink, Settings2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/utils"
import { createBookingPage, toggleBookingPage, updateBookingStatus } from "./actions"
import type { BookingPage, Booking, BookingStatus } from "@backoffice-os/database"

type PageWithCount = BookingPage & { _count: { bookings: number }; bookings: Booking[] }
type BookingWithPage = Booking & { bookingPage: { name: string; slug: string } }

const STATUS_CONFIG: Record<BookingStatus, { label: string; class: string }> = {
  PENDING:   { label: "Pending",   class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  CONFIRMED: { label: "Confirmed", class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  CANCELLED: { label: "Cancelled", class: "bg-muted text-muted-foreground border-border" },
  COMPLETED: { label: "Completed", class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  NO_SHOW:   { label: "No-show",   class: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
}

interface SchedulingClientProps {
  bookingPages: PageWithCount[]
  bookings: BookingWithPage[]
}

export function SchedulingClient({ bookingPages: initialPages, bookings: initialBookings }: SchedulingClientProps) {
  const [pages, setPages] = React.useState(initialPages)
  const [bookings, setBookings] = React.useState(initialBookings)
  const [tab, setTab] = React.useState("pages")
  const [createOpen, setCreateOpen] = React.useState(false)

  React.useEffect(() => { setPages(initialPages) }, [initialPages])
  React.useEffect(() => { setBookings(initialBookings) }, [initialBookings])

  async function handleToggle(pageId: string, current: boolean) {
    setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, isActive: !current } : p))
    const res = await toggleBookingPage(pageId, !current)
    if (res.error) {
      toast.error(res.error)
      setPages(initialPages)
    }
  }

  async function handleBookingAction(id: string, status: "CONFIRMED" | "CANCELLED") {
    setBookings((prev) => prev.map((b) => b.id === id ? { ...b, status } : b))
    const res = await updateBookingStatus(id, status)
    if (res.error) {
      toast.error(res.error)
      setBookings(initialBookings)
    } else {
      toast.success(status === "CONFIRMED" ? "Booking confirmed" : "Booking cancelled")
    }
  }

  function copyLink(slug: string) {
    const url = `${window.location.origin}/book/${slug}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Scheduling</h1>
          <p className="text-sm text-muted-foreground">{pages.length} booking pages · {bookings.length} total bookings</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
          <Plus className="size-3.5" />
          New booking page
        </Button>
      </div>

      {/* Tabs */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="pages" className="text-xs px-3">Booking pages</TabsTrigger>
            <TabsTrigger value="bookings" className="text-xs px-3">
              Bookings
              {bookings.filter((b) => b.status === "PENDING").length > 0 && (
                <span className="ml-1.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                  {bookings.filter((b) => b.status === "PENDING").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        {tab === "pages" && (
          <div className="p-6">
            {pages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Calendar className="size-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No booking pages yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create a booking page to let clients schedule time with you
                </p>
                <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
                  <Plus className="size-3.5" />
                  Create booking page
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className="bg-background rounded-xl border border-border p-5 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold">{page.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="size-3" />
                          {page.duration} min
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggle(page.id, page.isActive)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {page.isActive
                            ? <ToggleRight className="size-5 text-green-500" />
                            : <ToggleLeft className="size-5" />
                          }
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-6">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => copyLink(page.slug)}>
                              <Copy className="size-3.5 mr-2" />
                              Copy link
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/book/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="size-3.5 mr-2" />
                                Preview
                              </a>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {page.description && (
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{page.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users2 className="size-3" />
                          {page._count.bookings} bookings
                        </span>
                        {page.bufferTime > 0 && (
                          <span>{page.bufferTime}m buffer</span>
                        )}
                      </div>
                      <button
                        onClick={() => copyLink(page.slug)}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Link2 className="size-3" />
                        Copy link
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-[10px] text-muted-foreground font-mono truncate">
                        /book/{page.slug}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "bookings" && (
          <>
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Calendar className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No bookings yet</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30 sticky top-0">
                  <span>Guest</span>
                  <span>Booking page</span>
                  <span>When</span>
                  <span>Duration</span>
                  <span>Status</span>
                  <span />
                </div>
                <div className="divide-y divide-border">
                  {bookings.map((booking) => {
                    const status = STATUS_CONFIG[booking.status]
                    const duration = Math.round((booking.endAt.getTime() - booking.startAt.getTime()) / 60000)
                    return (
                      <div key={booking.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-muted/30">
                        <div>
                          <p className="text-sm font-medium">{booking.guestName}</p>
                          <p className="text-xs text-muted-foreground">{booking.guestEmail}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{booking.bookingPage.name}</span>
                        <div>
                          <p className="text-sm">{formatDate(booking.startAt, { month: "short", day: "numeric" })}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.startAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                        <span className="text-sm text-muted-foreground">{duration}m</span>
                        <span className={`inline-flex text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${status.class}`}>
                          {status.label}
                        </span>
                        {booking.status === "PENDING" ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleBookingAction(booking.id, "CONFIRMED")}
                            >
                              <CheckCircle2 className="size-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleBookingAction(booking.id, "CANCELLED")}
                            >
                              <XCircle className="size-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="w-[58px]" />
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <CreatePageDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(page) => setPages((prev) => [{ ...page, _count: { bookings: 0 }, bookings: [] } as PageWithCount, ...prev])}
      />
    </div>
  )
}

function CreatePageDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: (page: BookingPage) => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [name, setName] = React.useState("")
  const [slug, setSlug] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [duration, setDuration] = React.useState("60")

  // Auto-generate slug from name
  React.useEffect(() => {
    if (name) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }, [name])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await createBookingPage({
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      duration: parseInt(duration),
    })
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Booking page created")
      onCreated({ name, slug, duration: parseInt(duration), description } as BookingPage)
      setName(""); setSlug(""); setDescription(""); setDuration("60")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New booking page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Page name *</Label>
            <Input placeholder="30-minute discovery call" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>URL slug *</Label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground shrink-0">/book/</span>
              <Input
                placeholder="discovery-call"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <div className="flex gap-2">
              {["15", "30", "45", "60", "90"].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    duration === d
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  {d}m
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Brief description shown to guests..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={loading}>Create page</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
