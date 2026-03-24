"use client"

import * as React from "react"
import {
  Users2, Clock, TrendingUp, Search, MoreHorizontal,
  Crown, Shield, User as UserIcon, CheckCircle2, Calendar, Briefcase,
  Plus, Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, initials } from "@/lib/utils"
import type { Member, User, TimeEntry, Project, Task } from "@backoffice-os/database"

type MemberWithUser = Member & {
  user: Pick<User, "id" | "name" | "email" | "image" | "createdAt">
}

type TimeEntryWithRelations = TimeEntry & {
  user: Pick<User, "id" | "name">
  project: Pick<Project, "id" | "name"> | null
  task: Pick<Task, "id" | "title"> | null
}

interface HRClientProps {
  members: MemberWithUser[]
  timeEntries: TimeEntryWithRelations[]
  stats: {
    totalMembers: number
    totalHours: number
    billableHours: number
  }
}

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

export function HRClient({ members, timeEntries, stats }: HRClientProps) {
  const [tab, setTab] = React.useState("team")
  const [search, setSearch] = React.useState("")

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
      </div>
    </div>
  )
}
