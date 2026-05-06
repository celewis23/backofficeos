import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { InboxClient } from "./inbox-client"

export const metadata = { title: "Inbox — ArcheionOS" }

export default async function InboxPage() {
  const { orgId } = await requireOrg()

  const threads = await db.thread.findMany({
    where: { organizationId: orgId, isArchived: false },
    include: {
      client: { select: { id: true, name: true } },
      messages: {
        orderBy: { sentAt: "desc" },
        take: 1,
        select: { body: true, sentAt: true, from: true },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 50,
  })

  const emailAccounts = await db.emailAccount.findMany({
    where: { organizationId: orgId, isActive: true },
    select: { id: true, email: true, name: true, provider: true },
  })

  return <InboxClient threads={threads} emailAccounts={emailAccounts} />
}
