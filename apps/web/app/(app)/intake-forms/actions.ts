"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

const formSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  fields: z.array(z.object({
    id: z.string(),
    type: z.enum(["text", "textarea", "email", "phone", "number", "date", "select", "checkbox", "radio"]),
    label: z.string(),
    required: z.boolean().default(false),
    placeholder: z.string().optional(),
    options: z.array(z.string()).optional(),
  })),
  notifyEmail: z.string().email().optional().or(z.literal("")),
})

export async function createForm(data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = formSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const existing = await db.intakeForm.findFirst({
    where: { organizationId: orgId, slug: parsed.data.slug },
  })
  if (existing) return { error: "A form with this slug already exists" }

  const form = await db.intakeForm.create({
    data: {
      organizationId: orgId,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      fields: parsed.data.fields,
      notifyEmail: parsed.data.notifyEmail || null,
    },
  })

  revalidatePath("/intake-forms")
  return { success: true, id: form.id }
}

export async function updateForm(id: string, data: unknown) {
  const { orgId } = await requireOrg()
  const parsed = formSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const slugConflict = await db.intakeForm.findFirst({
    where: { organizationId: orgId, slug: parsed.data.slug, NOT: { id } },
  })
  if (slugConflict) return { error: "A form with this slug already exists" }

  await db.intakeForm.updateMany({
    where: { id, organizationId: orgId },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      fields: parsed.data.fields,
      notifyEmail: parsed.data.notifyEmail || null,
    },
  })

  revalidatePath("/intake-forms")
  return { success: true }
}

export async function toggleForm(id: string, isActive: boolean) {
  const { orgId } = await requireOrg()
  await db.intakeForm.updateMany({ where: { id, organizationId: orgId }, data: { isActive } })
  revalidatePath("/intake-forms")
  return { success: true }
}

export async function deleteForm(id: string) {
  const { orgId } = await requireOrg()
  await db.intakeForm.deleteMany({ where: { id, organizationId: orgId } })
  revalidatePath("/intake-forms")
  return { success: true }
}
