import type { Metadata } from "next"
import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { SchedulingClient } from "./scheduling-client"

export const metadata: Metadata = { title: "Scheduling" }

export default async function SchedulingPage() {
  const { orgId } = await requireOrg()

  const bookingPages = await db.bookingPage.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { bookings: true } },
      bookings: {
        orderBy: { startAt: "desc" },
        take: 20,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Flatten recent bookings across all pages
  const recentBookings = bookingPages
    .flatMap((page) => page.bookings.map((b) => ({
      ...b,
      bookingPage: { name: page.name, slug: page.slug },
    })))
    .sort((a, b) => b.startAt.getTime() - a.startAt.getTime())
    .slice(0, 20)

  return <SchedulingClient bookingPages={bookingPages} bookings={recentBookings} />
}
