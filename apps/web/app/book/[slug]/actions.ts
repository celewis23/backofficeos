"use server"

import { db } from "@backoffice-os/database"
import { z } from "zod"

const bookSchema = z.object({
  bookingPageId: z.string(),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().optional(),
  notes: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
})

export async function createBooking(input: unknown) {
  try {
    const data = bookSchema.parse(input)

    const page = await db.bookingPage.findUnique({
      where: { id: data.bookingPageId, isActive: true },
    })
    if (!page) return { error: "Booking page not found or inactive" }

    // Check for conflicts
    const conflict = await db.booking.findFirst({
      where: {
        bookingPageId: data.bookingPageId,
        status: { in: ["PENDING", "CONFIRMED"] },
        OR: [
          { startAt: { lt: new Date(data.endAt), gte: new Date(data.startAt) } },
          { endAt: { gt: new Date(data.startAt), lte: new Date(data.endAt) } },
        ],
      },
    })
    if (conflict) return { error: "This time slot is no longer available. Please choose another." }

    await db.booking.create({
      data: {
        bookingPageId: data.bookingPageId,
        guestName: data.guestName,
        guestEmail: data.guestEmail,
        guestPhone: data.guestPhone || null,
        notes: data.notes || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        status: page.requireConfirmation ? "PENDING" : "CONFIRMED",
      },
    })

    return {
      success: true,
      confirmed: !page.requireConfirmation,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create booking" }
  }
}
