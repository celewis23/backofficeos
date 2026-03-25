"use client"

import * as React from "react"
import {
  Users2, Clock, TrendingUp, Search, MoreHorizontal,
  Crown, Shield, User as UserIcon, Plus, Timer,
  DollarSign, RefreshCw, Link2, Link2Off, ChevronDown, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { formatDate, initials } from "@/lib/utils"
import type { Member, User, TimeEntry, Project, Task, PayrollRun, PayrollEmployeeSummary, PlatformConnection } from "@backoffice-os/database"
import { connectPayrollPlatform, disconnectPayrollPlatform, syncPayrollRuns, syncHoursToPayroll } from "./payroll-actions"

type MemberWithUser = Member & {
  user: Pick<User, "id" | "name" | "email" | "image" | "createdAt">
}

type TimeEntryWithRelations = TimeEntry & {
  user: Pick<User, "id" | "name">
  project: Pick<Project, "id" | "name"> | null
  task: Pick<Task, "id" | "title"> | null
}

type PayrollRunWithSummaries = PayrollRun & { summaries: PayrollEmployeeSummary[] }

interface HRClientProps {
  members: MemberWithUser[]
  timeEntries: TimeEntryWithRelations[]
  payrollRuns: PayrollRunWithSummaries[]
  payrollConnections: PlatformConnection[]
  stats: {
    totalMembers: number
    totalHours: number
    billableHours: number
  }
}

const PAYROLL_PLATFORMS = [
  { id: "gusto", name: "Gusto" },
  { id: "adp", name: "ADP" },
  { id: "rippling", name: "Rippling" },
  { id: "paychex", name: "Paychex" },
  { id: "quickbooks_payroll", name: "QuickBooks Payroll" },
  { id: "deel", name: "Deel" },
]

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; class: string }> = {
  owner:  { label: "Owner",  icon: Crown,    class: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800" },
  admin:  { label: "Admin",  icon: Shield,   class: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800" },
  member: { label: "Member", icon: UserIcon, class: "text-muted-foreground bg-muted border-border" },
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—"
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function HRClient({ members, timeEntries, payrollRuns, payrollConnections, stats }: HRClientProps) {
  const [tab, setTab] = React.useState("team")
  const [search, setSearch] = React.useState("")
  const [connectPlatform, setConnectPlatform] = React.useState<string | null>(null)
  const [connectKey, setConnectKey] = React.useState("")
  const [syncing, setSyncing] = React.useState<string | null>(null)
  const [expandedRun, setExpandedRun] = React.useState<string | null>(null)

  const filteredMembers = members.filter((m) =>
    search === "" ||
    m.user.name.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  )

  const filteredEntries = timeEntries.filter((e) =>
    search === "" ||
    e.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.project?.name ?? "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-lg font-semibold">HR & Team</h1>
          <p className="text-sm text-muted-foreground">{members.length} team members</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          Log time
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-px bg-border border-b border-border shrink-0">
        {[
          { label: "Team members", value: stats.totalMembers.toString(), icon: Users2, color: "text-primary" },
          { label: "Total hours (all time)", value: `${stats.totalHours}h`, icon: Clock, color: "text-blue-500" },
          { label: "Billable hours", value: `${stats.billableHours}h`, icon: TrendingUp, color: "text-green-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-background px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`size-3.5 ${stat.color}`} />
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="team" className="text-xs px-3">Team directory</TabsTrigger>
            <TabsTrigger value="time" className="text-xs px-3">Time entries</TabsTrigger>
            <TabsTrigger value="payroll" className="text-xs px-3">Payroll</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={tab === "team" ? "Search members..." : "Search entries..."}
            className="pl-9 h-8 w-52 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {tab === "team" && (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30 sticky top-0">
              <span>Member</span>
              <span>Email</span>
              <span>Role</span>
              <span>Joined</span>
              <span />
            </div>

            {filteredMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Users2 className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No members found</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredMembers.map((member) => {
                  const role = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member
                  const RoleIcon = role.icon
                  return (
                    <div
                      key={member.id}
                      className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-muted/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="size-8 shrink-0">
                          <AvatarImage src={member.user.image ?? undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                            {initials(member.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{member.user.name}</p>
                        </div>
                      </div>

                      <span className="text-sm text-muted-foreground truncate">{member.user.email}</span>

                      <div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${role.class}`}>
                          <RoleIcon className="size-2.5" />
                          {role.label}
                        </span>
                      </div>

                      <span className="text-sm text-muted-foreground">
                        {formatDate(member.createdAt)}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem>View profile</DropdownMenuItem>
                          <DropdownMenuItem>Change role</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {tab === "time" && (
          <>
            <div className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide border-b border-border bg-muted/30 sticky top-0">
              <span>Description</span>
              <span>Person</span>
              <span>Project</span>
              <span>Duration</span>
              <span>Date</span>
              <span />
            </div>

            {filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Timer className="size-8 text-muted-foreground/40 mb-3" />
                <p className="text-sm font-medium">No time entries this month</p>
                <p className="text-xs text-muted-foreground mt-1">Start tracking time on tasks and projects</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="grid grid-cols-[2fr_1.5fr_1.5fr_1fr_1fr_auto] gap-4 px-6 py-3.5 items-center hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {entry.isBillable && (
                        <div className="size-1.5 rounded-full bg-green-500 shrink-0" title="Billable" />
                      )}
                      <span className="text-sm text-foreground truncate">
                        {entry.task?.title ?? entry.description ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Avatar className="size-5 shrink-0">
                        <AvatarFallback className="text-[9px] bg-muted">
                          {initials(entry.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground truncate">{entry.user.name}</span>
                    </div>

                    <span className="text-sm text-muted-foreground truncate">
                      {entry.project?.name ?? "—"}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3 text-muted-foreground" />
                      <span className="text-sm font-medium">{formatDuration(entry.duration)}</span>
                    </div>

                    <span className="text-sm text-muted-foreground">
                      {formatDate(entry.startTime)}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "payroll" && (
          <div className="p-6 space-y-6">
            {/* Connected platforms */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Payroll Platforms</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PAYROLL_PLATFORMS.map((p) => {
                  const conn = payrollConnections.find((c) => c.platform === p.id)
                  return (
                    <div key={p.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{p.name}</p>
                        {conn?.lastSyncAt && (
                          <p className="text-xs text-muted-foreground">
                            Last sync {formatDate(conn.lastSyncAt)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {conn ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs"
                              disabled={syncing === p.id}
                              onClick={async () => {
                                setSyncing(p.id)
                                await syncPayrollRuns(p.id)
                                setSyncing(null)
                                window.location.reload()
                              }}
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${syncing === p.id ? "animate-spin" : ""}`} />
                              Sync
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-destructive"
                              onClick={async () => {
                                await disconnectPayrollPlatform(p.id)
                                window.location.reload()
                              }}
                            >
                              <Link2Off className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setConnectPlatform(p.id)}
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

            {/* Payroll Runs */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Payroll Runs</h3>
              {payrollRuns.length === 0 ? (
                <div className="border rounded-lg p-12 text-center text-muted-foreground">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No payroll runs yet. Connect a platform and sync.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {payrollRuns.map((run) => (
                    <div key={run.id} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                        onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedRun === run.id
                            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          }
                          <div>
                            <p className="text-sm font-medium">
                              {run.platform.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} —{" "}
                              {new Date(run.payPeriodStart).toLocaleDateString()} to{" "}
                              {new Date(run.payPeriodEnd).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {run.employeeCount} employees · Run {formatDate(run.runDate)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">${Number(run.totalGross).toLocaleString()}</p>
                          <Badge variant={run.status === "PAID" ? "default" : "secondary"} className="text-[10px]">
                            {run.status}
                          </Badge>
                        </div>
                      </button>
                      {expandedRun === run.id && (
                        <div className="border-t px-4 pb-3 bg-muted/20">
                          <table className="w-full text-sm mt-2">
                            <thead>
                              <tr className="text-xs text-muted-foreground">
                                <th className="text-left py-1">Employee</th>
                                <th className="text-right py-1">Gross</th>
                                <th className="text-right py-1">Taxes</th>
                                <th className="text-right py-1">Net</th>
                                <th className="text-right py-1">Hours</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {run.summaries.map((s) => (
                                <tr key={s.id}>
                                  <td className="py-1.5">
                                    {s.employeeName}
                                    {s.isContractor && (
                                      <Badge variant="secondary" className="ml-2 text-[9px]">Contractor</Badge>
                                    )}
                                  </td>
                                  <td className="text-right">${Number(s.grossPay).toLocaleString()}</td>
                                  <td className="text-right text-muted-foreground">${Number(s.taxes).toLocaleString()}</td>
                                  <td className="text-right font-medium">${Number(s.netPay).toLocaleString()}</td>
                                  <td className="text-right text-muted-foreground">{s.hoursPaid ? `${s.hoursPaid}h` : "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="border-t text-xs font-semibold">
                              <tr>
                                <td className="py-1.5">Total</td>
                                <td className="text-right">${Number(run.totalGross).toLocaleString()}</td>
                                <td className="text-right">${Number(run.totalTaxes).toLocaleString()}</td>
                                <td className="text-right">${Number(run.totalNet).toLocaleString()}</td>
                                <td />
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sync Hours */}
            <div>
              <h3 className="text-sm font-semibold mb-3">Sync Hours to Payroll</h3>
              <div className="border rounded-lg divide-y">
                {members.map((m) => {
                  const activePlatform = payrollConnections[0]
                  return (
                    <div key={m.id} className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-7">
                          <AvatarImage src={m.user.image ?? undefined} />
                          <AvatarFallback className="text-[10px]">{initials(m.user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{m.user.name}</span>
                      </div>
                      {activePlatform ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={syncing === `hours_${m.user.id}`}
                          onClick={async () => {
                            setSyncing(`hours_${m.user.id}`)
                            const result = await syncHoursToPayroll(m.user.id, activePlatform.platform)
                            setSyncing(null)
                            if ("error" in result) alert(result.error)
                            else alert(result.message ?? `Synced ${result.synced} entries`)
                          }}
                        >
                          <RefreshCw className={`h-3 w-3 mr-1 ${syncing === `hours_${m.user.id}` ? "animate-spin" : ""}`} />
                          Sync Hours
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Connect a platform first</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Connect Dialog */}
    <Dialog open={!!connectPlatform} onOpenChange={(o) => { if (!o) setConnectPlatform(null) }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            Connect {PAYROLL_PLATFORMS.find((p) => p.id === connectPlatform)?.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>API Key</Label>
            <Input
              placeholder="Paste your API key..."
              value={connectKey}
              onChange={(e) => setConnectKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConnectPlatform(null)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!connectPlatform) return
              const result = await connectPayrollPlatform(connectPlatform, connectKey)
              if ("error" in result) { alert(result.error); return }
              setConnectPlatform(null)
              setConnectKey("")
              window.location.reload()
            }}
          >
            Connect
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
