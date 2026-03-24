import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { CommandPalette } from "@/components/command-palette"
import { AIPanel } from "@/components/ai-panel"
import { NotificationPanel } from "@/components/notification-panel"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { orgId } = await requireOrg()
  const org = await db.organization.findUnique({
    where: { id: orgId },
    select: { name: true },
  })

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar orgName={org?.name ?? "Workspace"} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      <AIPanel />
      <NotificationPanel />
      <CommandPalette />
    </div>
  )
}
