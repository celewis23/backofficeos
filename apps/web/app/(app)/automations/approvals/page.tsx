import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { ApprovalsClient } from "./approvals-client"

export default async function ApprovalsPage() {
  const { orgId } = await requireOrg()

  const [pending, history] = await Promise.all([
    db.automationApproval.findMany({
      where: { organizationId: orgId, status: "PENDING" },
      orderBy: { requestedAt: "asc" },
      include: {
        run: {
          select: {
            id: true,
            entityType: true,
            entityId: true,
            automation: { select: { id: true, name: true, nodes: true } },
          },
        },
        approver: { select: { name: true, email: true } },
      },
    }),
    db.automationApproval.findMany({
      where: { organizationId: orgId, status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { approvedAt: "desc" },
      take: 50,
      include: {
        run: {
          select: {
            id: true,
            entityType: true,
            automation: { select: { id: true, name: true } },
          },
        },
        approver: { select: { name: true, email: true } },
      },
    }),
  ])

  return <ApprovalsClient pending={pending} history={history} />
}
