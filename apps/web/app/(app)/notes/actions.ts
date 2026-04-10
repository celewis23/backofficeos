"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const noteSchema = z.object({
  title: z.string().min(1).max(200).default("Untitled Note"),
  content: z.string().optional(),
  canvasData: z.string().optional(),
  color: z.string().optional(),
  isPinned: z.boolean().optional(),
})

export async function createNote(input?: unknown) {
  try {
    const { orgId, session } = await requireOrg()
    const data = noteSchema.parse(input ?? {})

    const note = await db.note.create({
      data: {
        organizationId: orgId,
        userId: session.user.id,
        title: data.title,
        content: data.content ?? null,
        canvasData: data.canvasData ?? null,
        color: data.color ?? null,
        isPinned: data.isPinned ?? false,
      },
    })

    revalidatePath("/notes")
    return { success: true, noteId: note.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create note"
    return { error: message }
  }
}

export async function updateNote(noteId: string, input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = noteSchema.partial().parse(input)

    await db.note.update({
      where: { id: noteId, organizationId: orgId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.content !== undefined && { content: data.content }),
        ...(data.canvasData !== undefined && { canvasData: data.canvasData }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isPinned !== undefined && { isPinned: data.isPinned }),
      },
    })

    revalidatePath("/notes")
    return { success: true }
  } catch (err) {
    return { error: "Failed to update note" }
  }
}

export async function deleteNote(noteId: string) {
  try {
    const { orgId } = await requireOrg()
    await db.note.delete({ where: { id: noteId, organizationId: orgId } })
    revalidatePath("/notes")
    return { success: true }
  } catch (err) {
    return { error: "Failed to delete note" }
  }
}
