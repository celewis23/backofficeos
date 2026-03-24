"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2, User, Bell, Lock, Palette, Globe,
  CreditCard, Trash2, LogOut, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { signOut } from "@/lib/auth-client"
import { initials } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const NAV_ITEMS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Plan & Billing", icon: CreditCard },
]

export function SettingsClient({ user, organization }: { user: any; organization: any }) {
  const router = useRouter()
  const [activeSection, setActiveSection] = React.useState("profile")

  async function handleSignOut() {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <aside className="w-56 border-r border-border shrink-0 py-4">
        <p className="px-4 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Settings
        </p>
        <nav className="space-y-0.5 px-2">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  activeSection === item.id
                    ? "bg-muted text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                <Icon className="size-3.5 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <Separator className="my-4 mx-4 w-auto" />

        <div className="px-2">
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleSignOut}
          >
            <LogOut className="size-3.5" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-8 max-w-2xl">
        {activeSection === "profile" && <ProfileSection user={user} />}
        {activeSection === "organization" && <OrgSection organization={organization} />}
        {activeSection === "notifications" && <NotificationsSection />}
        {activeSection === "security" && <SecuritySection />}
        {activeSection === "appearance" && <AppearanceSection />}
        {activeSection === "billing" && <BillingSection organization={organization} />}
      </main>
    </div>
  )
}

function ProfileSection({ user }: { user: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your personal information</p>
      </div>
      <Separator />

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={user?.image} />
          <AvatarFallback className="text-lg bg-primary/10 text-primary">
            {initials(user?.name ?? "?")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
          <Button variant="outline" size="sm" className="mt-2 text-xs">Change photo</Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Full name</Label>
            <Input defaultValue={user?.name} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={user?.email} type="email" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Phone</Label>
          <Input placeholder="+1 (555) 000-0000" />
        </div>
        <Button size="sm">Save changes</Button>
      </div>
    </div>
  )
}

function OrgSection({ organization }: { organization: any }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Organization</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your workspace settings</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Organization name</Label>
          <Input defaultValue={organization?.name} />
        </div>
        <div className="space-y-1.5">
          <Label>Slug (URL identifier)</Label>
          <Input defaultValue={organization?.slug} />
          <p className="text-xs text-muted-foreground">backoffice.os/<strong>{organization?.slug}</strong></p>
        </div>
        <div className="space-y-1.5">
          <Label>Custom domain</Label>
          <Input placeholder="app.yourdomain.com" />
          <p className="text-xs text-muted-foreground">Point a CNAME to our servers to use your own domain</p>
        </div>
        <div className="space-y-1.5">
          <Label>Default currency</Label>
          <Input defaultValue="USD" />
        </div>
        <div className="space-y-1.5">
          <Label>Timezone</Label>
          <Input defaultValue="America/New_York" />
        </div>
        <Button size="sm">Save changes</Button>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-destructive">Danger zone</h3>
        <div className="rounded-lg border border-destructive/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete organization</p>
              <p className="text-xs text-muted-foreground">Permanently delete this workspace and all its data</p>
            </div>
            <Button variant="destructive" size="sm">
              <Trash2 className="size-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  const notifications = [
    { label: "New invoice paid", description: "When a client pays an invoice", key: "invoice_paid" },
    { label: "Invoice overdue", description: "When an invoice becomes overdue", key: "invoice_overdue" },
    { label: "New booking", description: "When someone books a meeting", key: "new_booking" },
    { label: "Task assigned", description: "When a task is assigned to you", key: "task_assigned" },
    { label: "New message", description: "When you receive a new message", key: "new_message" },
    { label: "Team invitation accepted", description: "When someone joins your team", key: "team_joined" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Choose what you want to be notified about</p>
      </div>
      <Separator />

      <div className="space-y-4">
        {notifications.map((notif) => (
          <div key={notif.key} className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{notif.label}</p>
              <p className="text-xs text-muted-foreground">{notif.description}</p>
            </div>
            <Switch defaultChecked />
          </div>
        ))}
      </div>
    </div>
  )
}

function SecuritySection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your password and security settings</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Current password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm new password</Label>
          <Input type="password" placeholder="••••••••" />
        </div>
        <Button size="sm">Update password</Button>
      </div>
    </div>
  )
}

function AppearanceSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Customize how BackOfficeOS looks</p>
      </div>
      <Separator />

      <div className="space-y-4">
        <div>
          <Label className="mb-3 block">Theme</Label>
          <div className="grid grid-cols-3 gap-3">
            {["Light", "Dark", "System"].map((theme) => (
              <button
                key={theme}
                className="rounded-lg border-2 border-border p-3 text-sm font-medium hover:border-primary transition-colors"
              >
                {theme}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function BillingSection({ organization }: { organization: any }) {
  const plan = organization?.metadata ? JSON.parse(organization.metadata)?.plan ?? "FREE" : "FREE"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Plan & Billing</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your BackOfficeOS subscription</p>
      </div>
      <Separator />

      <div className="rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">{plan} Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {plan === "FREE" ? "Free forever with limited features" : "Billed monthly"}
            </p>
          </div>
          <Button variant="outline" size="sm">Upgrade</Button>
        </div>
      </div>
    </div>
  )
}
