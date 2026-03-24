import { auth } from "@backoffice-os/auth"
import { db } from "@backoffice-os/database"
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

  let activeOrgId = session.session.activeOrganizationId

  if (!activeOrgId) {
    const membership = await db.member.findFirst({
      where: { userId: session.user.id },
      select: { organizationId: true },
      orderBy: { createdAt: "asc" },
    })

    if (membership) {
      activeOrgId = membership.organizationId

      await db.session.update({
        where: { token: session.session.token },
        data: { activeOrganizationId: activeOrgId },
      })
    }
  }

  if (!activeOrgId) {
    redirect("/onboarding")
  }

  return { session, orgId: activeOrgId }
}
