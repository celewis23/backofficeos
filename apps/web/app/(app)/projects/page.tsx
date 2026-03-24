import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { ProjectsClient } from "./projects-client"

export const metadata = { title: "Projects — ArcheionOS" }

export default async function ProjectsPage() {
  const { orgId } = await requireOrg()

  const projects = await db.project.findMany({
    where: { organizationId: orgId, isTemplate: false },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { tasks: true, members: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  })

  return <ProjectsClient projects={projects} />
}
