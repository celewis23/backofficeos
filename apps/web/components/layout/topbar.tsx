"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  Search,
  Sun,
  Moon,
  Monitor,
  Bell,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/lib/stores/ui-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function Topbar({ title, breadcrumb, actions }: TopbarProps) {
  const { setCommandPaletteOpen, toggleAiPanel } = useUIStore();
  const { theme, setTheme } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-6">
      {/* Breadcrumb / title */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {breadcrumb ? (
          <nav className="flex items-center gap-1.5 text-sm">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-muted-foreground">/</span>}
                <span
                  className={cn(
                    i === breadcrumb.length - 1
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground cursor-pointer"
                  )}
                >
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        ) : title ? (
          <h1 className="text-sm font-semibold truncate">{title}</h1>
        ) : null}
      </div>

      {/* Global search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex h-8 items-center gap-2 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground min-w-[180px] max-w-[240px]"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left text-xs">Search...</span>
        <kbd className="flex items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <span className="text-[9px]">⌘</span>K
        </kbd>
      </button>

      {/* Right side actions */}
      <div className="flex items-center gap-1.5">
        {actions}

        {/* AI assistant */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={toggleAiPanel}>
              <Sparkles className="size-4 text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>BackOffice AI</TooltipContent>
        </Tooltip>

        {/* Notifications */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="relative">
              <Bell className="size-4" />
              <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm">
                  <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Theme</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className="size-4" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className="size-4" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className="size-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick add */}
        <Button size="sm" className="gap-1.5">
          <Plus className="size-3.5" />
          New
        </Button>
      </div>
    </header>
  );
}
