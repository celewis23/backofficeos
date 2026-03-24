"use client"

import * as React from "react"
import { CheckCircle2, XCircle, AlertCircle, ExternalLink, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Integration, IntegrationProvider, IntegrationStatus } from "@backoffice-os/database"

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

export function IntegrationsClient({ activeIntegrations }: { activeIntegrations: Integration[] }) {
  const [activeCategory, setActiveCategory] = React.useState("all")

  const activeMap = new Map(activeIntegrations.map((i) => [i.provider, i]))

  const filtered = activeCategory === "all"
    ? INTEGRATIONS
    : INTEGRATIONS.filter((i) => i.category === activeCategory)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            {activeIntegrations.filter((i) => i.status === "CONNECTED").length} connected
          </p>
        </div>
      </div>

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

      {/* Grid */}
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
    </div>
  )
}
