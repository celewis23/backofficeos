import type { Metadata } from "next"
import { db } from "@backoffice-os/database"
import { requireOrg } from "@/lib/auth-server"
import { HRClient } from "./hr-client"

export const metadata: Metadata = { title: "HR & Team" }

export default async function HRPage() {
  const { orgId } = await requireOrg()

  const [members, timeEntries, totalHours] = await Promise.all([
    db.member.findMany({
      where: { organizationId: orgId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),

    db.timeEntry.findMany({
      where: {
        organizationId: orgId,
        startTime: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "desc" },
      take: 50,
    }),

    db.timeEntry.aggregate({
      where: {
        organizationId: orgId,
        duration: { not: null },
      },
      _sum: { duration: true },
    }),
  ])

  const totalMinutes = totalHours._sum.duration ?? 0
  const billableEntries = await db.timeEntry.aggregate({
    where: { organizationId: orgId, isBillable: true, duration: { not: null } },
    _sum: { duration: true },
  })

  return (
    <HRClient
      members={members}
      timeEntries={timeEntries}
      stats={{
        totalMembers: members.length,
        totalHours: Math.round(totalMinutes / 60),
        billableHours: Math.round((billableEntries._sum.duration ?? 0) / 60),
      }}
    />
  )
}
