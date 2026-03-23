"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  Plus,
  ArrowRight,
  Search,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useUIStore } from "@/lib/stores/ui-store";

const NAVIGATION_ITEMS = [
  { href: "/dashboard",    icon: LayoutDashboard, label: "Dashboard",    shortcut: "" },
  { href: "/clients",      icon: Users2,          label: "Clients" },
  { href: "/billing",      icon: CreditCard,      label: "Billing" },
  { href: "/projects",     icon: Folders,         label: "Projects" },
  { href: "/inbox",        icon: Inbox,           label: "Inbox" },
  { href: "/calendar",     icon: Calendar,        label: "Calendar" },
  { href: "/documents",    icon: FileText,        label: "Documents" },
  { href: "/team",         icon: UsersRound,      label: "Team" },
  { href: "/integrations", icon: Zap,             label: "Integrations" },
  { href: "/settings",     icon: Settings,        label: "Settings" },
];

const QUICK_ACTIONS = [
  { icon: Plus,       label: "New Invoice",        action: "new-invoice" },
  { icon: Plus,       label: "New Client",         action: "new-client" },
  { icon: Plus,       label: "New Project",        action: "new-project" },
  { icon: Plus,       label: "New Task",           action: "new-task" },
  { icon: Sparkles,   label: "Ask BackOffice AI",  action: "open-ai" },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen, setAiPanelOpen } = useUIStore();

  // Global keyboard shortcut
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setCommandPaletteOpen]);

  const handleNavigate = (href: string) => {
    router.push(href);
    setCommandPaletteOpen(false);
  };

  const handleAction = (action: string) => {
    setCommandPaletteOpen(false);
    if (action === "open-ai") {
      setAiPanelOpen(true);
    }
    // Other actions will be wired up as modules are built
  };

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search or type a command..." />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4">
            <Search className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No results found</p>
          </div>
        </CommandEmpty>

        <CommandGroup heading="Quick Actions">
          {QUICK_ACTIONS.map((item) => (
            <CommandItem
              key={item.action}
              onSelect={() => handleAction(item.action)}
              className="gap-3"
            >
              <div className="flex size-6 items-center justify-center rounded-md border border-border bg-muted">
                <item.icon className="size-3.5 text-muted-foreground" />
              </div>
              {item.label}
              <ArrowRight className="ml-auto size-3.5 text-muted-foreground" />
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navigation">
          {NAVIGATION_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleNavigate(item.href)}
              className="gap-3"
            >
              <item.icon className="size-4 text-muted-foreground" />
              {item.label}
              {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>

      <div className="flex items-center gap-3 border-t border-border px-3 py-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↵</kbd>
          Select
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">↑↓</kbd>
          Navigate
        </span>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">Esc</kbd>
          Close
        </span>
      </div>
    </CommandDialog>
  );
}
