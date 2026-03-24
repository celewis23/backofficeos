import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { notFound } from "next/navigation"
import { ProjectBoard } from "./project-board"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const project = await db.project.findUnique({ where: { id }, select: { name: true } })
  return { title: project ? `${project.name} — Projects` : "Project not found" }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const { orgId } = await requireOrg()

  const project = await db.project.findUnique({
    where: { id, organizationId: orgId },
    include: {
      client: { select: { id: true, name: true } },
      members: true,
      tasks: {
        include: {
          assignments: true,
          tags: { include: { tag: true } },
          _count: { select: { subtasks: true, comments: true } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      },
    },
  })

  if (!project) notFound()

  return <ProjectBoard project={project} />
}
