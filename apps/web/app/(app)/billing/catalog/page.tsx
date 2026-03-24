import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { CatalogClient } from "./catalog-client"

export default async function CatalogPage() {
  const { orgId } = await requireOrg()

  const products = await db.product.findMany({
    where: { organizationId: orgId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  return <CatalogClient products={products} />
}
