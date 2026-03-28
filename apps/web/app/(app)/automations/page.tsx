import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { AutomationsClient } from "./automations-client"

export default async function AutomationsPage() {
  const { orgId } = await requireOrg()

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [automations, weekRuns, recentRuns, pendingApprovals] = await Promise.all([
    db.automation.findMany({
      where: { organizationId: orgId },
      include: {
        runs: {
          where: { dryRun: false },
          orderBy: { ranAt: "desc" },
          take: 7,
          select: { status: true, ranAt: true },
        },
        _count: { select: { runs: { where: { dryRun: false } } } },
      },
      orderBy: { createdAt: "desc" },
    }),

    db.automationRun.findMany({
      where: { organizationId: orgId, ranAt: { gte: weekAgo }, dryRun: false },
      select: { status: true },
    }),

    db.automationRun.findMany({
      where: { organizationId: orgId, dryRun: false },
      orderBy: { ranAt: "desc" },
      take: 30,
      select: {
        id: true,
        status: true,
        ranAt: true,
        entityType: true,
        automation: { select: { id: true, name: true } },
      },
    }),

    db.automationApproval.count({
      where: { organizationId: orgId, status: "PENDING" },
    }),
  ])

  const totalRuns = weekRuns.length
  const successRuns = weekRuns.filter((r) => r.status === "SUCCESS").length
  const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : null

  const stats = {
    total: automations.length,
    active: automations.filter((a) => a.isActive).length,
    runsThisWeek: totalRuns,
    successRate,
    pendingApprovals,
  }

  return (
    <AutomationsClient
      automations={automations}
      stats={stats}
      recentRuns={recentRuns}
    />
  )
}
