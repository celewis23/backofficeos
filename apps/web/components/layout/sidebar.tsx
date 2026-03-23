"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users2,
  CreditCard,
  Folders,
  Inbox,
  Calendar,
  FileText,
  UsersRound,
  Zap,
  Settings,
  Sparkles,
  ChevronLeft,
  Building2,
  Bell,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const NAV_ITEMS = [
  { href: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients",       icon: Users2,          label: "Clients",      badge: null },
  { href: "/billing",       icon: CreditCard,       label: "Billing",      badge: "3" },
  { href: "/projects",      icon: Folders,          label: "Projects" },
  { href: "/inbox",         icon: Inbox,            label: "Inbox",        badge: "12" },
  { href: "/calendar",      icon: Calendar,         label: "Calendar" },
  { href: "/documents",     icon: FileText,         label: "Documents" },
  { href: "/team",          icon: UsersRound,       label: "Team" },
] as const;

const BOTTOM_NAV = [
  { href: "/integrations",  icon: Zap,      label: "Integrations" },
  { href: "/settings",      icon: Settings, label: "Settings" },
] as const;

function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  collapsed,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: string | null;
  collapsed: boolean;
  active: boolean;
}) {
  const item = (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-colors",
          collapsed ? "size-5" : "size-4",
          active ? "text-sidebar-primary" : "text-sidebar-muted-foreground group-hover:text-sidebar-accent-foreground"
        )}
      />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto h-5 min-w-5 justify-center px-1 text-[10px]">
              {badge}
            </Badge>
          )}
        </>
      )}
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-sidebar-primary" />
      )}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge && <Badge variant="secondary" className="text-[10px]">{badge}</Badge>}
        </TooltipContent>
      </Tooltip>
    );
  }

  return item;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, setAiPanelOpen } = useUIStore();

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
        sidebarCollapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo + workspace */}
      <div className={cn(
        "flex h-14 items-center border-b border-sidebar-border px-3",
        sidebarCollapsed ? "justify-center" : "gap-2.5"
      )}>
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <Building2 className="size-4 text-primary-foreground" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">Acme Corp</p>
            <p className="truncate text-[10px] text-sidebar-muted-foreground">Workspace</p>
          </div>
        )}
      </div>

      {/* Main navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn("flex flex-col gap-0.5", sidebarCollapsed ? "px-1.5" : "px-2")}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={sidebarCollapsed}
              active={pathname === item.href || pathname.startsWith(item.href + "/")}
            />
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom section */}
      <div className={cn("border-t border-sidebar-border py-3", sidebarCollapsed ? "px-1.5" : "px-2")}>
        {/* AI Assistant button */}
        {sidebarCollapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setAiPanelOpen(true)}
                className="flex w-full items-center justify-center rounded-md px-2 py-2 transition-colors hover:bg-sidebar-accent/60 text-sidebar-muted-foreground hover:text-sidebar-primary mb-1"
              >
                <Sparkles className="size-5 text-sidebar-primary" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">BackOffice AI</TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={() => setAiPanelOpen(true)}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-primary hover:bg-sidebar-accent/60 transition-colors mb-1"
          >
            <Sparkles className="size-4 shrink-0" />
            <span>BackOffice AI</span>
          </button>
        )}

        {/* Bottom nav items */}
        <div className="flex flex-col gap-0.5">
          {BOTTOM_NAV.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              collapsed={sidebarCollapsed}
              active={pathname === item.href}
            />
          ))}
        </div>

        {/* User profile */}
        <div className="mt-2 pt-2 border-t border-sidebar-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-sidebar-accent/60",
                  sidebarCollapsed && "justify-center"
                )}
              >
                <Avatar size="sm">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/20 text-primary text-[11px] font-semibold">
                    JD
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="min-w-0 flex-1 text-left">
                    <p className="truncate text-xs font-medium text-sidebar-foreground">Jane Doe</p>
                    <p className="truncate text-[10px] text-sidebar-muted-foreground">jane@acme.com</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-sm">Jane Doe</span>
                  <span className="text-xs text-muted-foreground">jane@acme.com</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="size-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell className="size-4" /> Notifications
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "absolute -right-3 top-[52px] z-10 flex size-6 items-center justify-center rounded-full border border-border bg-background shadow-sm transition-all hover:bg-accent",
        )}
        aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={cn(
            "size-3 text-muted-foreground transition-transform duration-300",
            sidebarCollapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
