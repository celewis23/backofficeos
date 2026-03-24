import { requireOrg } from "@/lib/auth-server"
import { auth } from "@backoffice-os/auth"
import { headers } from "next/headers"
import { SettingsClient } from "./settings-client"

export const metadata = { title: "Settings — BackOfficeOS" }

export default async function SettingsPage() {
  const { session, orgId } = await requireOrg()

  const orgData = await auth.api.getFullOrganization({ headers: await headers() })

  return <SettingsClient user={session.user} organization={orgData} />
}
