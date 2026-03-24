"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Plus, Search, LayoutGrid, List, FolderKanban,
  Calendar, Users, MoreHorizontal, CheckCircle2,
  Clock, AlertCircle, PauseCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, cn } from "@/lib/utils"
import { NewProjectDialog } from "./new-project-dialog"
import type { Project, Client, ProjectStatus } from "@backoffice-os/database"

type ProjectWithRelations = Project & {
  client: Pick<Client, "id" | "name"> | null
  _count: { tasks: number; members: number }
}

const STATUS_CONFIG: Record<ProjectStatus, { label: string; icon: React.ElementType; color: string }> = {
  ACTIVE: { label: "Active", icon: CheckCircle2, color: "text-green-500" },
  ON_HOLD: { label: "On hold", icon: PauseCircle, color: "text-amber-500" },
  COMPLETED: { label: "Completed", icon: CheckCircle2, color: "text-blue-500" },
  CANCELLED: { label: "Cancelled", icon: AlertCircle, color: "text-destructive" },
  ARCHIVED: { label: "Archived", icon: Clock, color: "text-muted-foreground" },
}

const PROJECT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#14b8a6",
]

interface ProjectsClientProps {
  projects: ProjectWithRelations[]
}

export function ProjectsClient({ projects }: ProjectsClientProps) {
  const router = useRouter()
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [view, setView] = React.useState<"grid" | "list">("grid")
  const [newProjectOpen, setNewProjectOpen] = React.useState(false)

  const filtered = projects.filter((p) => {
    const matchesSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = projects.filter((p) => p.status === "ACTIVE").length
  const completedCount = projects.filter((p) => p.status === "COMPLETED").length

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Projects</h1>
            <p className="text-sm text-muted-foreground">
              {activeCount} active · {completedCount} completed
            </p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => setNewProjectOpen(true)}>
            <Plus className="size-3.5" />
            New project
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search projects..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="ml-auto flex items-center gap-1 border border-border rounded-md p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-6"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="size-3" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-6"
              onClick={() => setView("list")}
            >
              <List className="size-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {filtered.length === 0 ? (
            <EmptyState hasProjects={projects.length > 0} onNewProject={() => setNewProjectOpen(true)} />
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {filtered.map((project) => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onClick={() => router.push(`/projects/${project.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </>
  )
}

function ProjectCard({ project, onClick }: { project: ProjectWithRelations; onClick: () => void }) {
  const status = STATUS_CONFIG[project.status]
  const StatusIcon = status.icon

  return (
    <div
      className="rounded-xl border border-border bg-card hover:shadow-md transition-all cursor-pointer group overflow-hidden"
      onClick={onClick}
    >
      {/* Color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: project.color ?? "#6366f1" }}
      />

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-foreground truncate">{project.name}</h3>
            {project.client && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">{project.client.name}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-1.5">
          <StatusIcon className={`size-3 ${status.color}`} />
          <span className="text-xs text-muted-foreground">{status.label}</span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="size-3" />
            {project._count.tasks} tasks
          </span>
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {project._count.members}
          </span>
          {project.dueDate && (
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDate(project.dueDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function ProjectRow({ project, onClick }: { project: ProjectWithRelations; onClick: () => void }) {
  const status = STATUS_CONFIG[project.status]
  const StatusIcon = status.icon

  return (
    <div
      className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div
        className="size-2.5 rounded-full shrink-0"
        style={{ backgroundColor: project.color ?? "#6366f1" }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
        {project.client && (
          <p className="text-xs text-muted-foreground">{project.client.name}</p>
        )}
      </div>
      <div className="flex items-center gap-1.5 w-28">
        <StatusIcon className={`size-3 ${status.color}`} />
        <span className="text-xs text-muted-foreground">{status.label}</span>
      </div>
      <span className="text-xs text-muted-foreground w-20 text-center">{project._count.tasks} tasks</span>
      <span className="text-xs text-muted-foreground w-24 text-right">
        {project.dueDate ? formatDate(project.dueDate) : "—"}
      </span>
    </div>
  )
}

function EmptyState({ hasProjects, onNewProject }: { hasProjects: boolean; onNewProject: () => void }) {
  if (hasProjects) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Search className="size-8 text-muted-foreground/40 mb-3" />
        <p className="text-sm font-medium">No projects found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <FolderKanban className="size-7 text-primary" />
      </div>
      <p className="text-sm font-semibold">No projects yet</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-xs">
        Create your first project to start tracking tasks, time, and progress.
      </p>
      <Button size="sm" className="gap-1.5" onClick={onNewProject}>
        <Plus className="size-3.5" />
        Create first project
      </Button>
    </div>
  )
}
