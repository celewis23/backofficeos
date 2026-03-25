"use client"

import * as React from "react"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Link2, Link2Off, ShoppingCart, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Integration, IntegrationProvider, IntegrationStatus, PlatformConnection } from "@backoffice-os/database"
import { connectPlatform, disconnectPlatform, syncPosTransactions } from "./pos-actions"

// ──────────────────────────────────────────
// Legacy integrations (existing model)
// ──────────────────────────────────────────

interface IntegrationDef {
  provider: IntegrationProvider
  name: string
  description: string
  category: string
  logo: string
}

const INTEGRATIONS: IntegrationDef[] = [
  { provider: "GOOGLE_WORKSPACE", name: "Google Workspace", description: "Gmail, Calendar, Drive sync", category: "Productivity", logo: "G" },
  { provider: "MICROSOFT_365", name: "Microsoft 365", description: "Outlook, Teams, OneDrive sync", category: "Productivity", logo: "M" },
  { provider: "STRIPE", name: "Stripe", description: "Payment processing and subscriptions", category: "Payments", logo: "S" },
  { provider: "PAYPAL", name: "PayPal", description: "Accept PayPal payments", category: "Payments", logo: "P" },
  { provider: "SQUARE", name: "Square", description: "Point of sale and online payments", category: "Payments", logo: "Sq" },
  { provider: "QUICKBOOKS", name: "QuickBooks", description: "Accounting and bookkeeping sync", category: "Accounting", logo: "QB" },
  { provider: "XERO", name: "Xero", description: "Cloud accounting software", category: "Accounting", logo: "X" },
  { provider: "FRESHBOOKS", name: "FreshBooks", description: "Invoicing and accounting", category: "Accounting", logo: "FB" },
  { provider: "CALENDLY", name: "Calendly", description: "Import bookings from Calendly", category: "Scheduling", logo: "C" },
  { provider: "ACUITY", name: "Acuity Scheduling", description: "Import bookings from Acuity", category: "Scheduling", logo: "A" },
  { provider: "HUBSPOT", name: "HubSpot", description: "CRM and marketing automation", category: "CRM", logo: "H" },
  { provider: "SALESFORCE", name: "Salesforce", description: "Enterprise CRM sync", category: "CRM", logo: "SF" },
  { provider: "DOCUSIGN", name: "DocuSign", description: "Alternative e-signature provider", category: "Documents", logo: "DS" },
  { provider: "HELLOSIGN", name: "HelloSign", description: "Alternative e-signature provider", category: "Documents", logo: "HS" },
  { provider: "SLACK", name: "Slack", description: "Team notifications, client updates, and workflow alerts", category: "Communication", logo: "Sl" },
  { provider: "ZOOM", name: "Zoom", description: "Auto-create Zoom links for bookings", category: "Communication", logo: "Z" },
  { provider: "TWILIO", name: "Twilio", description: "SMS and voice for client communication", category: "Communication", logo: "T" },
  { provider: "ZAPIER", name: "Zapier", description: "Connect 5,000+ apps via Zapier", category: "Automation", logo: "Zp" },
  { provider: "MAKE", name: "Make", description: "Advanced workflow automation", category: "Automation", logo: "Mk" },
  { provider: "MEETUP", name: "Meetup", description: "Sync your Meetup groups and events to your calendar", category: "Community", logo: "Mu" },
  { provider: "EVENTBRITE", name: "Eventbrite", description: "Import and manage Eventbrite events alongside your schedule", category: "Community", logo: "Eb" },
  { provider: "FACEBOOK", name: "Facebook Groups & Events", description: "Sync Facebook Group events and manage RSVPs from one place", category: "Community", logo: "Fb" },
  { provider: "DISCORD", name: "Discord", description: "Send announcements and updates to your Discord community", category: "Community", logo: "Dc" },
]

const CATEGORIES = ["Productivity", "Payments", "Accounting", "Scheduling", "CRM", "Documents", "Communication", "Community", "Automation"]

const STATUS_CONFIG: Record<IntegrationStatus, { label: string; icon: React.ElementType; class: string }> = {
  CONNECTED: { label: "Connected", icon: CheckCircle2, class: "text-green-500" },
  DISCONNECTED: { label: "Disconnected", icon: XCircle, class: "text-muted-foreground" },
  ERROR: { label: "Error", icon: AlertCircle, class: "text-destructive" },
  PENDING: { label: "Pending", icon: AlertCircle, class: "text-amber-500" },
}

// ──────────────────────────────────────────
// POS platforms
// ──────────────────────────────────────────

const POS_PLATFORMS = [
  { id: "square", name: "Square", description: "Full-service POS and payments", logo: "Sq" },
  { id: "clover", name: "Clover", description: "Restaurant and retail POS", logo: "Cl" },
  { id: "shopify_pos", name: "Shopify POS", description: "Retail POS linked to your Shopify store", logo: "Sh" },
  { id: "toast", name: "Toast", description: "Restaurant-focused POS platform", logo: "To" },
  { id: "lightspeed", name: "Lightspeed", description: "Retail and restaurant POS", logo: "Ls" },
]

interface Props {
  activeIntegrations: Integration[]
  posConnections: PlatformConnection[]
  posStats: { todayTotal: number; todayCount: number }
}

export function IntegrationsClient({ activeIntegrations, posConnections, posStats }: Props) {
  const [tab, setTab] = React.useState("all")
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [connectingPos, setConnectingPos] = React.useState<string | null>(null)
  const [apiKey, setApiKey] = React.useState("")
  const [syncing, setSyncing] = React.useState<string | null>(null)

  const activeMap = new Map(activeIntegrations.map((i) => [i.provider, i]))
  const posMap = new Map(posConnections.map((c) => [c.platform, c]))

  const filtered = activeCategory === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === activeCategory)

  async function handlePosConnect() {
    if (!connectingPos) return
    const result = await connectPlatform({ platform: connectingPos, category: "pos", apiKey })
    if ("error" in result) { alert(result.error); return }
    setConnectingPos(null)
    setApiKey("")
    window.location.reload()
  }

  async function handleSync(platform: string) {
    setSyncing(platform)
    const result = await syncPosTransactions(platform)
    setSyncing(null)
    if ("error" in result) { alert(result.error); return }
    window.location.reload()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            {activeIntegrations.filter((i) => i.status === "CONNECTED").length} connected ·{" "}
            {posConnections.filter((c) => c.isActive).length} POS platforms
          </p>
        </div>
      </div>

      {/* Top tabs */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">All integrations</TabsTrigger>
            <TabsTrigger value="pos" className="text-xs px-3">Point of Sale</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {tab === "all" && (
        <>
          {/* Category filter */}
          <div className="flex items-center gap-2 px-6 py-3 border-b border-border overflow-x-auto shrink-0">
            <button
              className={cn(
                "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
                activeCategory === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setActiveCategory("all")}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors",
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((intDef) => {
                const active = activeMap.get(intDef.provider)
                const status = active
                  ? STATUS_CONFIG[active.status]
                  : STATUS_CONFIG.DISCONNECTED
                const StatusIcon = status.icon
                const isConnected = active?.status === "CONNECTED"

                return (
                  <div key={intDef.provider} className="rounded-xl border border-border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-bold text-sm text-foreground shrink-0">
                        {intDef.logo}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <StatusIcon className={`size-3.5 ${status.class}`} />
                        <span className={`text-[11px] ${status.class}`}>{status.label}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold">{intDef.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{intDef.description}</p>
                    </div>

                    <Badge variant="outline" className="text-[10px]">{intDef.category}</Badge>

                    <Button
                      variant={isConnected ? "outline" : "default"}
                      size="sm"
                      className="w-full text-xs"
                    >
                      {isConnected ? "Configure" : "Connect"}
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {tab === "pos" && (
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <ShoppingCart className="h-4 w-4" />
                <span className="text-sm">Today&apos;s transactions</span>
              </div>
              <p className="text-2xl font-semibold">{posStats.todayCount}</p>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Today&apos;s revenue</span>
              </div>
              <p className="text-2xl font-semibold">${posStats.todayTotal.toFixed(2)}</p>
            </div>
          </div>

          {/* POS platforms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {POS_PLATFORMS.map((p) => {
              const conn = posMap.get(p.id)
              const connected = conn?.isActive

              return (
                <div key={p.id} className="rounded-xl border p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-xl bg-muted flex items-center justify-center font-bold text-sm shrink-0">
                      {p.logo}
                    </div>
                    {connected
                      ? <CheckCircle2 className="size-4 text-green-500" />
                      : <XCircle className="size-4 text-muted-foreground" />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{p.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                    {conn?.lastSyncAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last sync {new Date(conn.lastSyncAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {connected ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          disabled={syncing === p.id}
                          onClick={() => handleSync(p.id)}
                        >
                          <RefreshCw className={cn("h-3 w-3 mr-1", syncing === p.id && "animate-spin")} />
                          Sync
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive px-2"
                          onClick={async () => {
                            await disconnectPlatform(p.id)
                            window.location.reload()
                          }}
                        >
                          <Link2Off className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setConnectingPos(p.id)}
                      >
                        <Link2 className="h-3 w-3 mr-1" /> Connect
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Connect POS Dialog */}
      <Dialog open={!!connectingPos} onOpenChange={(o) => { if (!o) { setConnectingPos(null); setApiKey("") } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Connect {POS_PLATFORMS.find((p) => p.id === connectingPos)?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>API Key / Access Token</Label>
              <Input
                placeholder="Paste your API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can find your API key in your {POS_PLATFORMS.find((p) => p.id === connectingPos)?.name} developer dashboard.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConnectingPos(null); setApiKey("") }}>Cancel</Button>
            <Button onClick={handlePosConnect}>Connect</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
