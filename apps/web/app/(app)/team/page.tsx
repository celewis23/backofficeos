import { requireOrg } from "@/lib/auth-server"
import { auth } from "@backoffice-os/auth"
import { headers } from "next/headers"
import { TeamClient } from "./team-client"

export const metadata = { title: "Team — BackOfficeOS" }

export default async function TeamPage() {
  const { orgId } = await requireOrg()

  const orgData = await auth.api.getFullOrganization({
    headers: await headers(),
  })

  return <TeamClient organization={orgData} />
}
