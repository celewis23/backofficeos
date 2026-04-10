import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { NotesClient } from "./notes-client"

export const metadata = { title: "Notes — ArcheionOS" }

export default async function NotesPage() {
  const { orgId, session } = await requireOrg()

  const notes = await db.note.findMany({
    where: { organizationId: orgId, userId: session.user.id },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  })

  return <NotesClient notes={notes} />
}
