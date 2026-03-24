import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import Link from "next/link"
import { Building2, FileText, Folders, FileSignature, FolderOpen, MessageSquare, LayoutDashboard, Clock } from "lucide-react"
import { CookieBanner } from "@/components/cookie-banner"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

const NAV = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/projects", label: "Projects", icon: Folders },
  { href: "/contracts", label: "Contracts", icon: FileSignature },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/messages", label: "Messages", icon: MessageSquare },
]

export default async function PortalLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          avatar: true,
          organization: { select: { name: true, logo: true } },
        },
      },
    },
  })

  if (!portalToken) {
    notFound()
  }

  if (portalToken.expiresAt < new Date()) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Clock className="size-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Your portal link has expired</h2>
          <p className="text-sm text-muted-foreground">
            For security, portal links expire after 30 days. Please contact your account manager to receive a new link.
          </p>
        </div>
        <CookieBanner />
      </div>
    )
  }

  const { client } = portalToken
  const orgName = client.organization.name

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="size-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">{orgName}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Portal for</span>
            <span className="font-medium text-foreground">{client.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar nav */}
        <aside className="w-48 shrink-0">
          <nav className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={`/portal/${token}${href}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Icon className="size-3.5 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <CookieBanner />
    </div>
  )
}
