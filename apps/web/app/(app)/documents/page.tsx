import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { DocumentsClient } from "./documents-client"

export const metadata = { title: "Documents — ArcheionOS" }

export default async function DocumentsPage() {
  const { orgId } = await requireOrg()

  const [documents, contracts, files] = await Promise.all([
    db.document.findMany({
      where: { organizationId: orgId },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    db.contract.findMany({
      where: { organizationId: orgId },
      include: { client: { select: { name: true } }, signers: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    db.file.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ])

  return <DocumentsClient documents={documents} contracts={contracts} files={files} />
}
