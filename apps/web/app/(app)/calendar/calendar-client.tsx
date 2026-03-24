"use client"

import * as React from "react"
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Clock, MapPin, Video, Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import type { Event, EventAttendee, Client } from "@backoffice-os/database"

type EventWithRelations = Event & {
  client: Pick<Client, "id" | "name"> | null
  attendees: EventAttendee[]
}

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function CalendarClient({ events }: { events: EventWithRelations[] }) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const cells: { date: Date; isCurrentMonth: boolean }[] = []

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false })
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  // Next month padding
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    cells.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
  }

  function getEventsForDate(date: Date) {
    return events.filter((e) => {
      const d = new Date(e.startAt)
      return d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()
    })
  }

  const today = new Date()
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  return (
    <div className="flex h-full">
      {/* Calendar */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">{MONTH_NAMES[month]} {year}</h1>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="size-7" onClick={prevMonth}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button variant="ghost" size="icon" className="size-7" onClick={nextMonth}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>
          <Button size="sm" className="gap-1.5">
            <Plus className="size-3.5" />
            New event
          </Button>
        </div>

        {/* Days header */}
        <div className="grid grid-cols-7 border-b border-border shrink-0">
          {DAYS_OF_WEEK.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-7 border-l border-t border-border h-full" style={{ minHeight: "600px" }}>
            {cells.map((cell, i) => {
              const cellEvents = getEventsForDate(cell.date)
              const isToday =
                cell.date.getDate() === today.getDate() &&
                cell.date.getMonth() === today.getMonth() &&
                cell.date.getFullYear() === today.getFullYear()
              const isSelected =
                selectedDate &&
                cell.date.getDate() === selectedDate.getDate() &&
                cell.date.getMonth() === selectedDate.getMonth() &&
                cell.date.getFullYear() === selectedDate.getFullYear()

              return (
                <div
                  key={i}
                  className={cn(
                    "border-r border-b border-border p-1.5 min-h-24 cursor-pointer hover:bg-muted/30 transition-colors",
                    !cell.isCurrentMonth && "opacity-40",
                    isSelected && "bg-primary/5"
                  )}
                  onClick={() => setSelectedDate(cell.date)}
                >
                  <div className={cn(
                    "text-xs font-medium mb-1 size-6 flex items-center justify-center rounded-full",
                    isToday && "bg-primary text-primary-foreground",
                    !isToday && "text-foreground"
                  )}>
                    {cell.date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {cellEvents.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white truncate"
                        style={{ backgroundColor: "#6366f1" }}
                      >
                        {event.title}
                      </div>
                    ))}
                    {cellEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground px-1">
                        +{cellEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Side panel: selected day events */}
      <div className="w-72 border-l border-border flex flex-col shrink-0">
        <div className="px-4 py-3.5 border-b border-border">
          <p className="text-sm font-semibold">
            {selectedDate ? selectedDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
          </p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {selectedDate === null ? (
            <p className="text-xs text-muted-foreground text-center mt-8">Click a day to see events</p>
          ) : selectedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon className="size-8 text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No events this day</p>
              <Button size="sm" variant="outline" className="mt-3 text-xs gap-1">
                <Plus className="size-3" />
                Add event
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div
                    className="h-0.5 rounded-full w-8 mb-2"
                    style={{ backgroundColor: "#6366f1" }}
                  />
                  <p className="text-sm font-medium">{event.title}</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3" />
                      {new Date(event.startAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                      {" — "}
                      {new Date(event.endAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="size-3" />
                        {event.location}
                      </div>
                    )}
                    {event.videoUrl && (
                      <div className="flex items-center gap-1.5">
                        <Video className="size-3" />
                        <a href={event.videoUrl} className="text-primary hover:underline truncate">
                          Join video call
                        </a>
                      </div>
                    )}
                    {event.attendees.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <Users className="size-3" />
                        {event.attendees.length} attendees
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
