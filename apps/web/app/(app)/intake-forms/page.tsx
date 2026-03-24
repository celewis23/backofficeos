import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { IntakeFormsClient } from "./intake-forms-client"

export default async function IntakeFormsPage() {
  const { orgId } = await requireOrg()

  const forms = await db.intakeForm.findMany({
    where: { organizationId: orgId },
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return <IntakeFormsClient forms={forms} />
}
