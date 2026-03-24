"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  videoUrl: z.string().optional(),
  startAt: z.string(),
  endAt: z.string(),
  allDay: z.boolean().default(false),
  clientId: z.string().optional(),
})

export async function createEvent(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createEventSchema.parse(input)

    await db.event.create({
      data: {
        organizationId: orgId,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        videoUrl: data.videoUrl || null,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
        allDay: data.allDay,
        clientId: data.clientId || null,
      },
    })

    revalidatePath("/calendar")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create event" }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const { orgId } = await requireOrg()

    await db.event.delete({ where: { id: eventId, organizationId: orgId } })

    revalidatePath("/calendar")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to delete event" }
  }
}
