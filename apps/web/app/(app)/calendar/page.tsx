import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { CalendarClient } from "./calendar-client"

export const metadata = { title: "Calendar — BackOfficeOS" }

export default async function CalendarPage() {
  const { orgId } = await requireOrg()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const events = await db.event.findMany({
    where: {
      organizationId: orgId,
      startAt: { gte: startOfMonth },
      endAt: { lte: endOfMonth },
    },
    include: {
      client: { select: { id: true, name: true } },
      attendees: true,
    },
    orderBy: { startAt: "asc" },
  })

  return <CalendarClient events={events} />
}
