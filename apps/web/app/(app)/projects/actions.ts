"use server"

import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  dueDate: z.string().optional(),
  clientId: z.string().optional(),
})

export async function createProject(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createProjectSchema.parse(input)

    const project = await db.project.create({
      data: {
        organizationId: orgId,
        name: data.name,
        description: data.description || null,
        color: data.color ?? "#6366f1",
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        clientId: data.clientId || null,
      },
    })

    revalidatePath("/projects")
    return { success: true, projectId: project.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create project" }
  }
}

const createTaskSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  priority: z.enum(["NONE", "LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: z.string().optional(),
  columnId: z.string().optional(),
  order: z.number().optional(),
})

export async function createTask(input: unknown) {
  try {
    const { orgId } = await requireOrg()
    const data = createTaskSchema.parse(input)

    const task = await db.task.create({
      data: {
        organizationId: orgId,
        projectId: data.projectId,
        title: data.title,
        description: data.description || null,
        priority: data.priority,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        columnId: data.columnId,
        order: data.order ?? 0,
        status: "TODO",
      },
    })

    revalidatePath(`/projects/${data.projectId}`)
    return { success: true, taskId: task.id }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to create task" }
  }
}

export async function updateTaskStatus(taskId: string, status: string) {
  try {
    const { orgId } = await requireOrg()

    const task = await db.task.update({
      where: { id: taskId, organizationId: orgId },
      data: {
        status: status as any,
        completedAt: status === "DONE" ? new Date() : null,
      },
    })

    revalidatePath(`/projects/${task.projectId}`)
    return { success: true }
  } catch (err) {
    return { error: "Failed to update task" }
  }
}
