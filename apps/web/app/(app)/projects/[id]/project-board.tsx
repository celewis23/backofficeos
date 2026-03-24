"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Plus, MoreHorizontal, Clock, Tag, CheckCircle2,
  MessageSquare, Paperclip, Flag, User, LayoutGrid, List,
  Calendar, Timer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, formatDate } from "@/lib/utils"
import { updateTaskStatus, createTask } from "../actions"
import { toast } from "sonner"
import type { Project, Task, TaskStatus, TaskPriority, TaskAssignment, TaskTag, Tag as TagModel } from "@backoffice-os/database"

type TaskWithRelations = Task & {
  assignments: TaskAssignment[]
  tags: (TaskTag & { tag: TagModel })[]
  _count: { subtasks: number; comments: number }
}

type ProjectWithTasks = Project & {
  client: { id: string; name: string } | null
  tasks: TaskWithRelations[]
  members: { id: string; userId: string; role: string }[]
}

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: "BACKLOG", label: "Backlog", color: "bg-muted/50" },
  { id: "TODO", label: "To Do", color: "bg-blue-50 dark:bg-blue-950/30" },
  { id: "IN_PROGRESS", label: "In Progress", color: "bg-amber-50 dark:bg-amber-950/30" },
  { id: "IN_REVIEW", label: "In Review", color: "bg-purple-50 dark:bg-purple-950/30" },
  { id: "DONE", label: "Done", color: "bg-green-50 dark:bg-green-950/30" },
]

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string }> = {
  NONE: { label: "None", color: "text-muted-foreground" },
  LOW: { label: "Low", color: "text-blue-500" },
  MEDIUM: { label: "Medium", color: "text-amber-500" },
  HIGH: { label: "High", color: "text-orange-500" },
  URGENT: { label: "Urgent", color: "text-red-500" },
}

export function ProjectBoard({ project }: { project: ProjectWithTasks }) {
  const router = useRouter()
  const [view, setView] = React.useState<"board" | "list">("board")
  const [tasks, setTasks] = React.useState(project.tasks)
  const [addingTo, setAddingTo] = React.useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = React.useState("")

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter((t) => t.status === col.id)
    return acc
  }, {} as Record<TaskStatus, TaskWithRelations[]>)

  async function handleMoveTask(taskId: string, newStatus: TaskStatus) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    const result = await updateTaskStatus(taskId, newStatus)
    if (result.error) {
      toast.error(result.error)
      setTasks(project.tasks)
    }
  }

  async function handleAddTask(status: TaskStatus) {
    if (!newTaskTitle.trim()) {
      setAddingTo(null)
      return
    }
    const result = await createTask({
      projectId: project.id,
      title: newTaskTitle.trim(),
      columnId: status,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Task created")
      router.refresh()
    }
    setNewTaskTitle("")
    setAddingTo(null)
  }

  const totalTasks = tasks.length
  const doneTasks = tasks.filter((t) => t.status === "DONE").length
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <Link href="/projects">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div
          className="size-3 rounded-full shrink-0"
          style={{ backgroundColor: project.color ?? "#6366f1" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground truncate">{project.name}</h1>
            {project.client && (
              <Link href={`/clients/${project.client.id}`}>
                <Badge variant="outline" className="text-[10px]">{project.client.name}</Badge>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-1 w-20 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{progress}%</span>
            </div>
            <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks} tasks</span>
            {project.dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="size-3" />
                {formatDate(project.dueDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as any)}>
            <TabsList className="h-7">
              <TabsTrigger value="board" className="text-xs px-2.5 h-6">
                <LayoutGrid className="size-3 mr-1.5" />Board
              </TabsTrigger>
              <TabsTrigger value="list" className="text-xs px-2.5 h-6">
                <List className="size-3 mr-1.5" />List
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => { setAddingTo("TODO"); setNewTaskTitle("") }}
          >
            <Plus className="size-3.5" />
            Add task
          </Button>
        </div>
      </div>

      {/* Board */}
      {view === "board" && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 h-full min-w-max">
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus[col.id] ?? []
              return (
                <div key={col.id} className="w-72 shrink-0 flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{col.label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6"
                      onClick={() => { setAddingTo(col.id); setNewTaskTitle("") }}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>

                  {/* Tasks */}
                  <div className={cn("flex-1 rounded-xl p-2 space-y-2 min-h-32", col.color)}>
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onStatusChange={(newStatus) => handleMoveTask(task.id, newStatus)}
                      />
                    ))}

                    {/* Inline add */}
                    {addingTo === col.id && (
                      <div className="bg-card rounded-lg border border-border p-2 shadow-sm">
                        <input
                          autoFocus
                          className="w-full text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
                          placeholder="Task name..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddTask(col.id)
                            if (e.key === "Escape") { setAddingTo(null); setNewTaskTitle("") }
                          }}
                          onBlur={() => handleAddTask(col.id)}
                        />
                        <div className="flex items-center gap-1 mt-2">
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => { setAddingTo(null); setNewTaskTitle("") }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="flex-1 overflow-auto">
          <div className="divide-y divide-border">
            {tasks
              .filter((t) => t.status !== "DONE")
              .concat(tasks.filter((t) => t.status === "DONE"))
              .map((task) => (
                <TaskListRow key={task.id} task={task} />
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TaskCard({ task, onStatusChange }: {
  task: TaskWithRelations
  onStatusChange: (status: TaskStatus) => void
}) {
  const priority = PRIORITY_CONFIG[task.priority]

  return (
    <div className="bg-card rounded-lg border border-border p-3 shadow-sm hover:shadow-md transition-all cursor-pointer group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <MoreHorizontal className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.tags.slice(0, 3).map(({ tag }) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-medium"
              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <Flag className={`size-3 ${priority.color}`} />
          {task.dueDate && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Clock className="size-2.5" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {task._count.comments > 0 && (
            <span className="flex items-center gap-0.5">
              <MessageSquare className="size-2.5" />
              {task._count.comments}
            </span>
          )}
          {task._count.subtasks > 0 && (
            <span className="flex items-center gap-0.5">
              <CheckCircle2 className="size-2.5" />
              {task._count.subtasks}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function TaskListRow({ task }: { task: TaskWithRelations }) {
  const priority = PRIORITY_CONFIG[task.priority]
  const isDone = task.status === "DONE"

  return (
    <div className={cn(
      "flex items-center gap-4 px-6 py-3 hover:bg-muted/40 transition-colors",
      isDone && "opacity-60"
    )}>
      <CheckCircle2 className={cn("size-4 shrink-0", isDone ? "text-green-500" : "text-muted-foreground")} />
      <span className={cn("text-sm flex-1", isDone && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      <Flag className={`size-3.5 ${priority.color}`} />
      {task.dueDate && (
        <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
      )}
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {task.status.replace("_", " ")}
      </span>
    </div>
  )
}
