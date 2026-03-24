import { auth } from "@backoffice-os/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  return session
}

export async function requireSession() {
  const session = await getSession()
  if (!session) {
    redirect("/login")
  }
  return session
}

export async function requireOrg() {
  const session = await requireSession()
  const activeOrgId = session.session.activeOrganizationId
  if (!activeOrgId) {
    redirect("/onboarding")
  }
  return { session, orgId: activeOrgId }
}
