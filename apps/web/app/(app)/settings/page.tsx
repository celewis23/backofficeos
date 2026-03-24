import { requireOrg } from "@/lib/auth-server"
import { auth } from "@backoffice-os/auth"
import { headers } from "next/headers"
import { db } from "@backoffice-os/database"
import { SettingsClient } from "./settings-client"

export const metadata = { title: "Settings — ArcheionOS" }

export default async function SettingsPage() {
  const { session, orgId } = await requireOrg()

  const [orgData, customFields, taxRates, auditLogs, gdprRequests] = await Promise.all([
    auth.api.getFullOrganization({ headers: await headers() }),
    db.customField.findMany({ where: { organizationId: orgId }, orderBy: [{ entityType: "asc" }, { sortOrder: "asc" }] }),
    db.taxRate.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
    db.auditLog.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { name: true, email: true } } },
    }),
    db.gdprRequest.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: "desc" } }),
  ])

  return (
    <SettingsClient
      user={session.user}
      organization={orgData}
      customFields={customFields}
      taxRates={taxRates}
      auditLogs={auditLogs}
      gdprRequests={gdprRequests}
    />
  )
}
