"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createPageSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  duration: z.number().int().min(15).default(60),
  bufferTime: z.number().int().min(0).default(15),
  requireConfirmation: z.boolean().default(false),
  collectPhone: z.boolean().default(false),
  collectNotes: z.boolean().default(true),
})

export async function createBookingPage(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createPageSchema.parse(input)

    const existing = await db.bookingPage.findUnique({
      where: { organizationId_slug: { organizationId: orgId, slug: data.slug } },
    })
    if (existing) return { error: `Slug "${data.slug}" is already taken` }

    const page = await db.bookingPage.create({
      data: {
        organizationId: orgId,
        name: data.name,
        slug: data.slug,
        description: data.description || null,
        duration: data.duration,
        bufferTime: data.bufferTime,
        requireConfirmation: data.requireConfirmation,
        collectPhone: data.collectPhone,
        collectNotes: data.collectNotes,
        availabilityRules: {
          timezone: "America/New_York",
          days: [1, 2, 3, 4, 5],
          startTime: "09:00",
          endTime: "17:00",
        },
      },
    })

    revalidatePath("/scheduling")
    return { success: true, id: page.id, slug: page.slug }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create booking page" }
  }
}

export async function toggleBookingPage(pageId: string, isActive: boolean) {
  try {
    const { orgId } = await requireOrg()

    await db.bookingPage.update({
      where: { id: pageId, organizationId: orgId },
      data: { isActive },
    })

    revalidatePath("/scheduling")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update booking page" }
  }
}

export async function updateBookingStatus(bookingId: string, status: "CONFIRMED" | "CANCELLED") {
  try {
    const { orgId } = await requireOrg()

    // Verify ownership through bookingPage
    const booking = await db.booking.findFirst({
      where: { id: bookingId, bookingPage: { organizationId: orgId } },
    })
    if (!booking) return { error: "Booking not found" }

    await db.booking.update({
      where: { id: bookingId },
      data: {
        status,
        cancelledAt: status === "CANCELLED" ? new Date() : null,
      },
    })

    revalidatePath("/scheduling")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update booking" }
  }
}
