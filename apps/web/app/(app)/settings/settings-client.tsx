"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Building2, User, Bell, Lock, Palette,
  CreditCard, Trash2, LogOut, ShieldCheck, ShieldOff,
  Smartphone, Monitor, Globe, MapPin, Clock3, AlertTriangle,
  CheckCircle2, XCircle,
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

type Session = { id: string; ipAddress: string | null; userAgent: string | null; createdAt: string; updatedAt: string; isCurrent: boolean }
type LoginEvent = { id: string; ipAddress: string | null; userAgent: string | null; success: boolean; createdAt: string }
type TwoFactorState = "loading" | "disabled" | "setup" | "verifying" | "enabled"

function parseDevice(ua: string | null) {
  if (!ua) return { device: "Unknown device", browser: "Unknown browser" }
  const device = /mobile|android|iphone/i.test(ua) ? "Mobile" : "Desktop"
  const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : ua.includes("Edge") ? "Edge" : "Browser"
  return { device, browser }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function SecuritySection() {
  const [twoFactorState, setTwoFactorState] = React.useState<TwoFactorState>("loading")
  const [qrCode, setQrCode] = React.useState<string>("")
  const [secret, setSecret] = React.useState<string>("")
  const [verifyCode, setVerifyCode] = React.useState("")
  const [backupCodes, setBackupCodes] = React.useState<string[]>([])
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [loginEvents, setLoginEvents] = React.useState<LoginEvent[]>([])
  const [loadingSessions, setLoadingSessions] = React.useState(true)
  const [loadingActivity, setLoadingActivity] = React.useState(true)
  const [verifying, setVerifying] = React.useState(false)
  const [currentPw, setCurrentPw] = React.useState("")
  const [newPw, setNewPw] = React.useState("")
  const [confirmPw, setConfirmPw] = React.useState("")
  const [savingPw, setSavingPw] = React.useState(false)

  React.useEffect(() => {
    // Check current 2FA status
    fetch("/api/auth/2fa/verify", { method: "GET" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setTwoFactorState(data?.enabled ? "enabled" : "disabled"))
      .catch(() => setTwoFactorState("disabled"))

    // Load sessions
    fetch("/api/auth/sessions")
      .then((r) => r.json())
      .then(({ sessions: data }) => setSessions(data ?? []))
      .catch(() => {})
      .finally(() => setLoadingSessions(false))

    // Load login activity
    fetch("/api/auth/login-activity")
      .then((r) => r.json())
      .then(({ events }) => setLoginEvents(events ?? []))
      .catch(() => {})
      .finally(() => setLoadingActivity(false))
  }, [])

  async function begin2FASetup() {
    setTwoFactorState("setup")
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
    const data = await res.json()
    setQrCode(data.qrCode)
    setSecret(data.secret)
  }

  async function verify2FA() {
    setVerifying(true)
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verifyCode }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Invalid code"); return }
      setBackupCodes(data.backupCodes)
      setTwoFactorState("verifying")
    } catch { toast.error("Something went wrong") }
    finally { setVerifying(false) }
  }

  async function disable2FA() {
    const res = await fetch("/api/auth/2fa/verify", { method: "DELETE" })
    if (res.ok) { setTwoFactorState("disabled"); toast.success("2FA disabled") }
  }

  async function revokeSession(sessionId: string) {
    await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
    setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    toast.success("Session revoked")
  }

  async function revokeAllOther() {
    await fetch("/api/auth/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revokeAll: true }),
    })
    setSessions((prev) => prev.filter((s) => s.isCurrent))
    toast.success("All other sessions revoked")
  }

  async function updatePassword() {
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return }
    if (newPw.length < 8) { toast.error("Password must be at least 8 characters"); return }
    setSavingPw(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      if (!res.ok) { const d = await res.json(); toast.error(d.error ?? "Failed"); return }
      toast.success("Password updated")
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
    } catch { toast.error("Something went wrong") }
    finally { setSavingPw(false) }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold">Security</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your password and account security</p>
      </div>

      {/* Password */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Change password</h3>
        </div>
        <Separator />
        <div className="space-y-3 max-w-sm">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input type="password" placeholder="••••••••" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input type="password" placeholder="••••••••" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input type="password" placeholder="••••••••" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          </div>
          <Button size="sm" onClick={updatePassword} disabled={savingPw}>
            {savingPw ? "Updating..." : "Update password"}
          </Button>
        </div>
      </div>

      {/* Two-Factor Auth */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Two-factor authentication (2FA)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account</p>
        </div>
        <Separator />

        {twoFactorState === "loading" && (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}

        {twoFactorState === "disabled" && (
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <ShieldOff className="size-8 text-muted-foreground/50" />
              <div>
                <p className="text-sm font-medium">2FA is not enabled</p>
                <p className="text-xs text-muted-foreground">Use an authenticator app to generate codes</p>
              </div>
            </div>
            <Button size="sm" onClick={begin2FASetup}>Enable 2FA</Button>
          </div>
        )}

        {twoFactorState === "setup" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4 space-y-4">
              <p className="text-sm font-medium">Step 1: Scan this QR code with your authenticator app</p>
              {qrCode && <img src={qrCode} alt="2FA QR Code" className="size-40 rounded-md" />}
              <p className="text-xs text-muted-foreground">
                Or enter this key manually: <code className="bg-muted px-1 rounded text-xs font-mono">{secret}</code>
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Step 2: Enter the 6-digit code from your app</p>
                <div className="flex gap-2 max-w-xs">
                  <Input
                    placeholder="000000"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
                    className="font-mono tracking-widest text-center"
                  />
                  <Button size="sm" onClick={verify2FA} disabled={verifyCode.length !== 6 || verifying}>
                    {verifying ? "Verifying..." : "Verify"}
                  </Button>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setTwoFactorState("disabled")}>Cancel</Button>
            </div>
          </div>
        )}

        {twoFactorState === "verifying" && backupCodes.length > 0 && (
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="size-4" />
              <p className="text-sm font-semibold">2FA enabled successfully!</p>
            </div>
            <p className="text-xs text-muted-foreground">Save these backup codes in a secure place. Each code can only be used once.</p>
            <div className="grid grid-cols-4 gap-1.5">
              {backupCodes.map((code) => (
                <code key={code} className="rounded bg-muted px-2 py-1 text-xs font-mono text-center">{code}</code>
              ))}
            </div>
            <Button size="sm" onClick={() => setTwoFactorState("enabled")}>Done</Button>
          </div>
        )}

        {twoFactorState === "enabled" && (
          <div className="flex items-center justify-between rounded-lg border border-green-500/30 p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-8 text-green-500" />
              <div>
                <p className="text-sm font-medium">2FA is enabled</p>
                <p className="text-xs text-muted-foreground">Your account is protected with two-factor authentication</p>
              </div>
            </div>
            <Button variant="destructive" size="sm" onClick={disable2FA}>Disable</Button>
          </div>
        )}
      </div>

      {/* Active Sessions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Active sessions</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Devices currently signed into your account</p>
          </div>
          {sessions.filter((s) => !s.isCurrent).length > 0 && (
            <Button variant="outline" size="sm" className="text-xs" onClick={revokeAllOther}>
              Revoke all other
            </Button>
          )}
        </div>
        <Separator />

        {loadingSessions ? (
          <p className="text-sm text-muted-foreground">Loading sessions...</p>
        ) : (
          <div className="space-y-2">
            {sessions.map((s) => {
              const { device, browser } = parseDevice(s.userAgent)
              const DeviceIcon = device === "Mobile" ? Smartphone : Monitor
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <DeviceIcon className="size-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{browser} on {device}</p>
                      {s.isCurrent && (
                        <span className="rounded-full bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">Current</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {s.ipAddress && (
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Globe className="size-3" />{s.ipAddress}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock3 className="size-3" />{timeAgo(s.updatedAt)}
                      </span>
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => revokeSession(s.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              )
            })}
            {sessions.length === 0 && <p className="text-sm text-muted-foreground">No sessions found</p>}
          </div>
        )}
      </div>

      {/* Login Activity */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Login activity</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Recent login attempts for your account</p>
        </div>
        <Separator />

        {loadingActivity ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : loginEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No login activity recorded yet</p>
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Device</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">IP Address</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {loginEvents.map((event) => {
                  const { device, browser } = parseDevice(event.userAgent)
                  return (
                    <tr key={event.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        {event.success ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="size-3" /> Success
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-red-500">
                            <XCircle className="size-3" /> Failed
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{browser} / {device}</td>
                      <td className="px-3 py-2 text-muted-foreground">{event.ipAddress ?? "—"}</td>
                      <td className="px-3 py-2 text-muted-foreground">{timeAgo(event.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AppearanceSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Customize how ArcheionOS looks</p>
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
        <p className="text-sm text-muted-foreground mt-0.5">Manage your ArcheionOS subscription</p>
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
