"use client"

import * as React from "react"
import {
  Users, UserPlus, Mail, MoreHorizontal, Crown,
  Shield, UserCog, User, ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { initials } from "@/lib/utils"
import { InviteTeamMemberDialog } from "./invite-dialog"

const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  owner: { label: "Owner", icon: Crown, color: "text-amber-500" },
  admin: { label: "Admin", icon: Shield, color: "text-blue-500" },
  manager: { label: "Manager", icon: UserCog, color: "text-purple-500" },
  member: { label: "Member", icon: User, color: "text-muted-foreground" },
  client: { label: "Client", icon: User, color: "text-muted-foreground" },
}

export function TeamClient({ organization }: { organization: any }) {
  const [inviteOpen, setInviteOpen] = React.useState(false)
  const members = organization?.members ?? []
  const invitations = organization?.invitations?.filter((i: any) => i.status === "pending") ?? []

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg font-semibold">Team</h1>
            <p className="text-sm text-muted-foreground">{members.length} members</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
            <UserPlus className="size-3.5" />
            Invite member
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Members */}
          <div>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Team members ({members.length})
            </h2>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {members.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="size-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No members yet</p>
                </div>
              ) : (
                members.map((member: any) => {
                  const role = ROLE_CONFIG[member.role] ?? ROLE_CONFIG.member
                  const RoleIcon = role.icon
                  return (
                    <div key={member.id} className="flex items-center gap-4 px-4 py-3.5">
                      <Avatar className="size-9">
                        <AvatarImage src={member.user?.image ?? undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {initials(member.user?.name ?? "?")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{member.user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <RoleIcon className={`size-3.5 ${role.color}`} />
                        <span className="text-xs text-muted-foreground">{role.label}</span>
                      </div>
                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem>Change role</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">Remove from team</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Pending invitations */}
          {invitations.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Pending invitations ({invitations.length})
              </h2>
              <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
                {invitations.map((inv: any) => (
                  <div key={inv.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="size-9 rounded-full bg-muted flex items-center justify-center">
                      <Mail className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">Invited · expires {new Date(inv.expiresAt).toLocaleDateString()}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">{inv.role ?? "member"}</Badge>
                    <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive">
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <InviteTeamMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </>
  )
}
