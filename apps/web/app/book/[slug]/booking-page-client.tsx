"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Building2, Clock, CheckCircle2, ChevronLeft, Calendar, Mail, User, Phone, MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBooking } from "./actions"

interface Slot {
  date: string
  time: string
  startAt: string
  endAt: string
}

interface PageInfo {
  id: string
  name: string
  description: string | null
  duration: number
  collectPhone: boolean
  collectNotes: boolean
  requireConfirmation: boolean
  organization: { name: string; logo: string | null }
}

export function BookingPageClient({ page, slots }: { page: PageInfo; slots: Slot[] }) {
  const [selectedSlot, setSelectedSlot] = React.useState<Slot | null>(null)
  const [step, setStep] = React.useState<"pick" | "form" | "done">("pick")
  const [loading, setLoading] = React.useState(false)
  const [confirmed, setConfirmed] = React.useState(false)

  // Group slots by date
  const slotsByDate = React.useMemo(() => {
    const map = new Map<string, Slot[]>()
    for (const slot of slots) {
      if (!map.has(slot.date)) map.set(slot.date, [])
      map.get(slot.date)!.push(slot)
    }
    return map
  }, [slots])

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [notes, setNotes] = React.useState("")

  async function handleBook(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSlot) return
    setLoading(true)
    const res = await createBooking({
      bookingPageId: page.id,
      guestName: name,
      guestEmail: email,
      guestPhone: phone || undefined,
      notes: notes || undefined,
      startAt: selectedSlot.startAt,
      endAt: selectedSlot.endAt,
    })
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      setConfirmed(!page.requireConfirmation)
      setStep("done")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Org branding */}
        <div className="flex items-center gap-2 justify-center mb-8">
          {page.organization.logo ? (
            <img src={page.organization.logo} alt={page.organization.name} className="h-8 w-auto" />
          ) : (
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="size-4 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold text-foreground">{page.organization.name}</span>
        </div>

        <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-semibold">{page.name}</h1>
            {page.description && (
              <p className="text-sm text-muted-foreground mt-1">{page.description}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Clock className="size-3.5" />
              <span>{page.duration} minutes</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === "pick" && (
              <motion.div
                key="pick"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                <p className="text-sm font-medium mb-4">Select a date and time</p>
                {slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    No availability in the next 14 days.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Array.from(slotsByDate.entries()).map(([date, dateSlots]) => (
                      <div key={date}>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                          <Calendar className="size-3" />
                          {date}
                        </p>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {dateSlots.map((slot) => (
                            <button
                              key={slot.startAt}
                              onClick={() => {
                                setSelectedSlot(slot)
                                setStep("form")
                              }}
                              className="text-sm font-medium py-2 px-3 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                            >
                              {slot.time}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === "form" && selectedSlot && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6"
              >
                {/* Selected slot */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedSlot.date}</p>
                      <p className="text-muted-foreground">{selectedSlot.time} · {page.duration}m</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setStep("pick")} className="gap-1 text-xs">
                    <ChevronLeft className="size-3" />
                    Change
                  </Button>
                </div>

                <form onSubmit={handleBook} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <User className="size-3.5 text-muted-foreground" />
                      Your name *
                    </Label>
                    <Input placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground" />
                      Email address *
                    </Label>
                    <Input type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  {page.collectPhone && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <Phone className="size-3.5 text-muted-foreground" />
                        Phone number
                      </Label>
                      <Input placeholder="+1 555 000 0000" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  )}
                  {page.collectNotes && (
                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-1.5">
                        <MessageSquare className="size-3.5 text-muted-foreground" />
                        Anything you'd like to share?
                      </Label>
                      <Textarea
                        placeholder="Topics to cover, questions, context..."
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" size="lg" loading={loading}>
                    Confirm booking
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    A confirmation will be sent to your email address.
                  </p>
                </form>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 text-center"
              >
                <div className="flex justify-center mb-4">
                  <div className={`size-16 rounded-full flex items-center justify-center ${confirmed ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}>
                    <CheckCircle2 className={`size-8 ${confirmed ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`} />
                  </div>
                </div>
                <h2 className="text-xl font-semibold">
                  {confirmed ? "You're booked!" : "Request received!"}
                </h2>
                {selectedSlot && (
                  <div className="mt-3 inline-flex items-center gap-2 text-sm bg-muted rounded-lg px-4 py-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    {selectedSlot.date} at {selectedSlot.time}
                  </div>
                )}
                <p className="text-sm text-muted-foreground mt-4">
                  {confirmed
                    ? "A confirmation email has been sent to your inbox."
                    : "Your request is awaiting confirmation. You'll receive an email once it's confirmed."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by <span className="font-medium">ArcheionOS</span>
        </p>
      </div>
    </div>
  )
}
