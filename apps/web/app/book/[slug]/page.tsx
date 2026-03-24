import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { BookingPageClient } from "./booking-page-client"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const page = await db.bookingPage.findFirst({ where: { slug, isActive: true } })
  if (!page) return { title: "Booking Not Found" }
  return { title: `Book a ${page.name}` }
}

export default async function PublicBookingPage({ params }: Props) {
  const { slug } = await params

  const bookingPage = await db.bookingPage.findFirst({
    where: { slug, isActive: true },
    include: {
      organization: {
        select: { name: true, logo: true },
      },
    },
  })

  if (!bookingPage) notFound()

  // Generate available time slots for the next 14 days
  const now = new Date()
  const rules = bookingPage.availabilityRules as {
    days: number[]
    startTime: string
    endTime: string
    timezone: string
  }

  const slots: { date: string; time: string; startAt: string; endAt: string }[] = []

  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const date = new Date(now)
    date.setDate(date.getDate() + dayOffset)
    date.setHours(0, 0, 0, 0)

    if (!rules.days.includes(date.getDay())) continue

    const [startH, startM] = rules.startTime.split(":").map(Number)
    const [endH, endM] = rules.endTime.split(":").map(Number)

    let cursor = new Date(date)
    cursor.setHours(startH, startM, 0, 0)
    const end = new Date(date)
    end.setHours(endH, endM, 0, 0)

    // Get existing bookings for this day to exclude
    const existing = await db.booking.findMany({
      where: {
        bookingPageId: bookingPage.id,
        startAt: { gte: cursor, lt: end },
        status: { in: ["PENDING", "CONFIRMED"] },
      },
      select: { startAt: true, endAt: true },
    })

    while (
      cursor.getTime() + bookingPage.duration * 60000 + bookingPage.bufferTime * 60000 <=
      end.getTime()
    ) {
      const slotEnd = new Date(cursor.getTime() + bookingPage.duration * 60000)
      const blocked = existing.some(
        (b) => cursor < b.endAt && slotEnd > b.startAt
      )

      if (!blocked) {
        slots.push({
          date: cursor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }),
          time: cursor.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          startAt: cursor.toISOString(),
          endAt: slotEnd.toISOString(),
        })
      }

      cursor = new Date(cursor.getTime() + (bookingPage.duration + bookingPage.bufferTime) * 60000)
    }
  }

  return (
    <BookingPageClient
      page={{
        id: bookingPage.id,
        name: bookingPage.name,
        description: bookingPage.description,
        duration: bookingPage.duration,
        collectPhone: bookingPage.collectPhone,
        collectNotes: bookingPage.collectNotes,
        requireConfirmation: bookingPage.requireConfirmation,
        organization: bookingPage.organization,
      }}
      slots={slots}
    />
  )
}
