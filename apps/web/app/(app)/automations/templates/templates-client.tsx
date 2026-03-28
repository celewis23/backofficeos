"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft, Zap, Clock, Mail, Bell, GitBranch, CheckSquare, Tag,
  Users, CreditCard, TrendingUp, Briefcase, CalendarCheck, Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { createFromTemplate } from "./actions"
import type { AutomationTemplate } from "@/lib/automation-templates"

type Props = {
  templates: AutomationTemplate[]
  categories: Record<string, string>
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  clients: <Users className="size-4" />,
  billing: <CreditCard className="size-4" />,
  leads: <TrendingUp className="size-4" />,
  projects: <Briefcase className="size-4" />,
  bookings: <CalendarCheck className="size-4" />,
}

function nodeTypeIcon(type: string) {
  switch (type) {
    case "trigger": return <Zap className="size-3" />
    case "delay":   return <Clock className="size-3" />
    case "condition": return <GitBranch className="size-3" />
    default: return <CheckSquare className="size-3" />
  }
}

function actionIcon(actionType?: string) {
  if (!actionType) return <Zap className="size-3" />
  if (actionType.includes("email")) return <Mail className="size-3" />
  if (actionType.includes("notification")) return <Bell className="size-3" />
  if (actionType.includes("tag")) return <Tag className="size-3" />
  if (actionType.includes("task")) return <CheckSquare className="size-3" />
  return <Zap className="size-3" />
}

function TemplateCard({ template, onUse, loading }: {
  template: AutomationTemplate
  onUse: (id: string) => void
  loading: boolean
}) {
  const nodeCount = template.graph.nodes.length
  const actionCount = template.graph.nodes.filter((n) => n.type === "action").length
  const hasDelay = template.graph.nodes.some((n) => n.type === "delay")
  const hasCondition = template.graph.nodes.some((n) => n.type === "condition")

  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 hover:border-border/80 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-tight">{template.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
        </div>
        <Badge variant="secondary" className="text-[10px] shrink-0 capitalize">
          {template.category}
        </Badge>
      </div>

      {/* Step preview */}
      <div className="flex items-center gap-1 flex-wrap">
        {template.graph.nodes.map((node, i) => (
          <React.Fragment key={node.id}>
            <div className={cn(
              "flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium",
              node.type === "trigger"
                ? "bg-primary/10 text-primary"
                : node.type === "delay"
                  ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                  : node.type === "condition"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-muted text-muted-foreground"
            )}>
              {node.type === "action"
                ? actionIcon((node.config as { action_type?: string }).action_type)
                : nodeTypeIcon(node.type)}
              <span className="capitalize">{
                node.type === "action"
                  ? ((node.config as { action_type?: string }).action_type)?.replace(/_/g, " ") ?? "action"
                  : node.type
              }</span>
            </div>
            {i < template.graph.nodes.length - 1 && (
              <span className="text-muted-foreground/40 text-[10px]">→</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Stats + saving */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{actionCount} action{actionCount !== 1 ? "s" : ""}</span>
          {hasDelay && <span className="text-[10px] text-muted-foreground">• delay</span>}
          {hasCondition && <span className="text-[10px] text-muted-foreground">• condition</span>}
        </div>
        <span className="text-[10px] text-green-600 dark:text-green-400 font-medium">{template.estimatedSaving}</span>
      </div>

      <Button
        size="sm"
        className="w-full mt-auto"
        onClick={() => onUse(template.id)}
        disabled={loading}
      >
        {loading ? "Creating…" : "Use Template"}
      </Button>
    </div>
  )
}

export function TemplatesClient({ templates, categories }: Props) {
  const [activeCategory, setActiveCategory] = React.useState<string>("all")
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  const filtered = activeCategory === "all"
    ? templates
    : templates.filter((t) => t.category === activeCategory)

  async function handleUse(templateId: string) {
    setLoadingId(templateId)
    try {
      await createFromTemplate(templateId)
      // createFromTemplate redirects on success — toast won't fire unless it throws
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create automation")
      setLoadingId(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href="/automations">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-sm font-semibold flex items-center gap-1.5">
              <Sparkles className="size-4 text-primary" />
              Template Library
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Start with a pre-built automation — customise in the builder
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href="/automations/new/builder">
            Build from scratch
          </Link>
        </Button>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1 px-6 py-3 border-b border-border shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
            activeCategory === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          All ({templates.length})
        </button>
        {Object.entries(categories).map(([key, label]) => {
          const count = templates.filter((t) => t.category === key).length
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                activeCategory === key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {CATEGORY_ICONS[key]}
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onUse={handleUse}
              loading={loadingId === template.id}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
