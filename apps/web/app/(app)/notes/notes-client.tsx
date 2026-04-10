"use client"

import * as React from "react"
import { getStroke } from "perfect-freehand"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Trash2,
  MoreHorizontal,
  Pen,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Minus,
  ChevronDown,
  StickyNote,
  Palette,
} from "lucide-react"
import { createNote, updateNote, deleteNote } from "./actions"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────

type RawNote = {
  id: string
  title: string
  content: string | null
  canvasData: string | null
  color: string | null
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

type Stroke = {
  id: string
  points: number[][]
  color: string
  size: number
  isEraser: boolean
}

type CanvasData = {
  strokes: Stroke[]
}

// ─── Perfect-freehand helpers ─────────────────────────────────────────────────

const PEN_OPTIONS = {
  size: 4,
  smoothing: 0.5,
  thinning: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: { taper: 0, easing: (t: number) => t, cap: true },
  end: { taper: 0, easing: (t: number) => t, cap: true },
  simulatePressure: true,
}

function getSvgPath(points: number[][]): string {
  const stroke = getStroke(points, PEN_OPTIONS)
  if (!stroke.length) return ""
  const d: (string | number)[] = ["M", stroke[0][0], stroke[0][1], "Q"]
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i]
    const [x1, y1] = stroke[(i + 1) % stroke.length]
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  d.push("Z")
  return d.join(" ")
}

function getEraserPath(points: number[][], size: number): string {
  const stroke = getStroke(points, { ...PEN_OPTIONS, size, thinning: 0, simulatePressure: false })
  if (!stroke.length) return ""
  const d: (string | number)[] = ["M", stroke[0][0], stroke[0][1], "Q"]
  for (let i = 0; i < stroke.length; i++) {
    const [x0, y0] = stroke[i]
    const [x1, y1] = stroke[(i + 1) % stroke.length]
    d.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
  }
  d.push("Z")
  return d.join(" ")
}

// ─── Note colours ─────────────────────────────────────────────────────────────

const NOTE_COLORS = [
  { label: "Default", value: null, bg: "bg-card", border: "border-border" },
  { label: "Yellow", value: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-300 dark:border-amber-700" },
  { label: "Blue", value: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-300 dark:border-blue-700" },
  { label: "Green", value: "#22c55e", bg: "bg-green-50 dark:bg-green-950/30", border: "border-green-300 dark:border-green-700" },
  { label: "Pink", value: "#ec4899", bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-300 dark:border-pink-700" },
  { label: "Purple", value: "#a855f7", bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-300 dark:border-purple-700" },
  { label: "Red", value: "#ef4444", bg: "bg-red-50 dark:bg-red-950/30", border: "border-red-300 dark:border-red-700" },
]

const PEN_COLORS = [
  "#1e293b", // slate-900
  "#2563eb", // blue
  "#16a34a", // green
  "#dc2626", // red
  "#9333ea", // purple
  "#d97706", // amber
  "#ec4899", // pink
  "#ffffff", // white
]

const PEN_SIZES = [2, 4, 8, 14, 20]

// ─── Drawing Canvas ───────────────────────────────────────────────────────────

function DrawingCanvas({
  canvasData,
  onChange,
}: {
  canvasData: CanvasData
  onChange: (data: CanvasData) => void
}) {
  const svgRef = React.useRef<SVGSVGElement>(null)
  const [strokes, setStrokes] = React.useState<Stroke[]>(canvasData.strokes ?? [])
  const [history, setHistory] = React.useState<Stroke[][]>([canvasData.strokes ?? []])
  const [historyIndex, setHistoryIndex] = React.useState(0)
  const [currentPoints, setCurrentPoints] = React.useState<number[][]>([])
  const [isDrawing, setIsDrawing] = React.useState(false)
  const [tool, setTool] = React.useState<"pen" | "eraser">("pen")
  const [penColor, setPenColor] = React.useState(PEN_COLORS[0])
  const [penSize, setPenSize] = React.useState(1) // index into PEN_SIZES

  // Keep parent in sync
  React.useEffect(() => {
    onChange({ strokes })
  }, [strokes]) // eslint-disable-line react-hooks/exhaustive-deps

  function pushHistory(newStrokes: Stroke[]) {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newStrokes)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  function undo() {
    if (historyIndex <= 0) return
    const prev = history[historyIndex - 1]
    setHistoryIndex(historyIndex - 1)
    setStrokes(prev)
    onChange({ strokes: prev })
  }

  function redo() {
    if (historyIndex >= history.length - 1) return
    const next = history[historyIndex + 1]
    setHistoryIndex(historyIndex + 1)
    setStrokes(next)
    onChange({ strokes: next })
  }

  function getPoint(e: React.PointerEvent<SVGSVGElement>): number[] {
    const rect = svgRef.current!.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top, e.pressure || 0.5]
  }

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    setCurrentPoints([getPoint(e)])
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!isDrawing) return
    setCurrentPoints((prev) => [...prev, getPoint(e)])
  }

  function onPointerUp() {
    if (!isDrawing || currentPoints.length === 0) return
    setIsDrawing(false)

    const newStroke: Stroke = {
      id: crypto.randomUUID(),
      points: currentPoints,
      color: tool === "eraser" ? "eraser" : penColor,
      size: PEN_SIZES[penSize],
      isEraser: tool === "eraser",
    }
    const newStrokes = [...strokes, newStroke]
    setStrokes(newStrokes)
    pushHistory(newStrokes)
    setCurrentPoints([])
  }

  function clearCanvas() {
    setStrokes([])
    pushHistory([])
    onChange({ strokes: [] })
  }

  const currentSize = PEN_SIZES[penSize]

  return (
    <div className="flex flex-col h-full">
      {/* Canvas Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30 flex-wrap">
        {/* Pen / Eraser */}
        <div className="flex items-center rounded-md border border-border overflow-hidden">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTool("pen")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors",
                  tool === "pen"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <Pen className="size-3.5" /> Pen
              </button>
            </TooltipTrigger>
            <TooltipContent>Draw with pen / stylus</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setTool("eraser")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors border-l border-border",
                  tool === "eraser"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-muted-foreground"
                )}
              >
                <Eraser className="size-3.5" /> Eraser
              </button>
            </TooltipTrigger>
            <TooltipContent>Eraser</TooltipContent>
          </Tooltip>
        </div>

        {/* Pen color */}
        {tool === "pen" && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    <span
                      className="size-3 rounded-full border border-border/50"
                      style={{ background: penColor }}
                    />
                    <Palette className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Pen colour</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start" className="p-2">
              <div className="grid grid-cols-4 gap-1.5">
                {PEN_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setPenColor(c)}
                    className={cn(
                      "size-6 rounded-full border-2 transition-transform hover:scale-110",
                      penColor === c ? "border-primary shadow-sm" : "border-transparent"
                    )}
                    style={{ background: c, outline: c === "#ffffff" ? "1px solid #e2e8f0" : undefined }}
                    title={c}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Pen / eraser size */}
        <div className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5">
          <button
            onClick={() => setPenSize((s) => Math.max(0, s - 1))}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            disabled={penSize === 0}
          >
            <Minus className="size-3" />
          </button>
          <span className="w-5 text-center text-xs font-medium tabular-nums">{currentSize}</span>
          <button
            onClick={() => setPenSize((s) => Math.min(PEN_SIZES.length - 1, s + 1))}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            disabled={penSize === PEN_SIZES.length - 1}
          >
            <Plus className="size-3" />
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Undo / Redo */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground"
            >
              <Undo2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 rounded-md hover:bg-muted transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground"
            >
              <Redo2 className="size-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          onClick={clearCanvas}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-md hover:bg-destructive/10"
        >
          Clear canvas
        </button>

        <div className="ml-auto text-xs text-muted-foreground">
          {strokes.length} stroke{strokes.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-zinc-950 relative">
        {strokes.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none">
            <Pen className="size-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground/40">
              {tool === "pen" ? "Start drawing — use your pen, stylus, or mouse" : "Nothing to erase yet"}
            </p>
          </div>
        )}
        <svg
          ref={svgRef}
          className="w-full h-full touch-none cursor-crosshair"
          style={{ touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          {/* Subtle dot grid */}
          <defs>
            <pattern id="dot-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="0.8" fill="currentColor" className="text-muted-foreground/15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

          {/* Completed strokes */}
          {strokes.map((stroke) =>
            stroke.isEraser ? (
              <path
                key={stroke.id}
                d={getEraserPath(stroke.points, stroke.size * 2)}
                fill="white"
                className="dark:fill-zinc-950"
              />
            ) : (
              <path
                key={stroke.id}
                d={getSvgPath(stroke.points)}
                fill={stroke.color}
              />
            )
          )}

          {/* Active stroke */}
          {isDrawing && currentPoints.length > 1 && (
            tool === "eraser" ? (
              <path
                d={getEraserPath(currentPoints, currentSize * 2)}
                fill="white"
                className="dark:fill-zinc-950"
              />
            ) : (
              <path
                d={getSvgPath(currentPoints)}
                fill={penColor}
              />
            )
          )}
        </svg>
      </div>
    </div>
  )
}

// ─── Text Editor ──────────────────────────────────────────────────────────────

function TextEditor({
  content,
  onChange,
}: {
  content: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-muted/30">
        <Type className="size-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Text Note</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {content.length} char{content.length !== 1 ? "s" : ""}
        </span>
      </div>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Start typing your note here…&#10;&#10;Use Markdown for formatting:&#10;  # Heading&#10;  **bold**, _italic_&#10;  - bullet points"
        className="flex-1 resize-none border-0 bg-transparent p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground/50 font-mono"
        spellCheck
      />
    </div>
  )
}

// ─── Note list item ───────────────────────────────────────────────────────────

function NoteListItem({
  note,
  isActive,
  onSelect,
  onPin,
  onDelete,
}: {
  note: RawNote
  isActive: boolean
  onSelect: () => void
  onPin: () => void
  onDelete: () => void
}) {
  const colorEntry = NOTE_COLORS.find((c) => c.value === note.color) ?? NOTE_COLORS[0]

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full text-left rounded-lg border p-3 transition-all duration-150 hover:shadow-sm",
        isActive
          ? "border-primary/50 bg-primary/5 shadow-sm"
          : `${colorEntry.border} ${colorEntry.bg} hover:border-primary/30`
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            {note.isPinned && <Pin className="size-3 text-amber-500 shrink-0" />}
            <span className="text-sm font-medium truncate text-foreground">{note.title}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {note.content
              ? note.content.slice(0, 80)
              : note.canvasData
              ? "Canvas note"
              : "Empty note"}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1.5">
            {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-all">
              <MoreHorizontal className="size-3.5 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin() }}>
              {note.isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
              {note.isPinned ? "Unpin" : "Pin"}
            </DropdownMenuItem>
            <DropdownMenuItem destructive onClick={(e) => { e.stopPropagation(); onDelete() }}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {note.color && (
        <div
          className="mt-2 h-0.5 w-8 rounded-full opacity-60"
          style={{ background: note.color }}
        />
      )}
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NotesClient({ notes: initialNotes }: { notes: RawNote[] }) {
  const [notes, setNotes] = React.useState<RawNote[]>(initialNotes)
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialNotes[0]?.id ?? null
  )
  const [search, setSearch] = React.useState("")
  const [editorTab, setEditorTab] = React.useState<"text" | "canvas">("text")
  const [isSaving, setIsSaving] = React.useState(false)

  // Debounce save
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedNote = notes.find((n) => n.id === selectedId) ?? null

  const filtered = notes.filter((n) =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    (n.content ?? "").toLowerCase().includes(search.toLowerCase())
  )

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate() {
    const res = await createNote({ title: "Untitled Note" })
    if (res.error) { toast.error(res.error); return }
    const newNote: RawNote = {
      id: res.noteId!,
      title: "Untitled Note",
      content: null,
      canvasData: null,
      color: null,
      isPinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    setNotes((prev) => [newNote, ...prev])
    setSelectedId(newNote.id)
    setEditorTab("text")
  }

  // ── Auto-save ───────────────────────────────────────────────────────────────
  function scheduleSave(noteId: string, patch: Partial<RawNote>) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...patch, updatedAt: new Date() } : n))
    )
    setIsSaving(true)
    saveTimerRef.current = setTimeout(async () => {
      await updateNote(noteId, {
        title: patch.title,
        content: patch.content,
        canvasData: patch.canvasData,
        color: patch.color,
        isPinned: patch.isPinned,
      })
      setIsSaving(false)
    }, 800)
  }

  // ── Title change ─────────────────────────────────────────────────────────────
  function handleTitleChange(value: string) {
    if (!selectedNote) return
    scheduleSave(selectedNote.id, { title: value || "Untitled Note" })
  }

  // ── Content change ────────────────────────────────────────────────────────────
  function handleContentChange(value: string) {
    if (!selectedNote) return
    scheduleSave(selectedNote.id, { content: value })
  }

  // ── Canvas change ─────────────────────────────────────────────────────────────
  function handleCanvasChange(data: CanvasData) {
    if (!selectedNote) return
    scheduleSave(selectedNote.id, { canvasData: JSON.stringify(data) })
  }

  // ── Pin ───────────────────────────────────────────────────────────────────────
  async function handlePin(note: RawNote) {
    scheduleSave(note.id, { isPinned: !note.isPinned })
  }

  // ── Colour ────────────────────────────────────────────────────────────────────
  function handleColor(color: string | null) {
    if (!selectedNote) return
    scheduleSave(selectedNote.id, { color })
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(noteId: string) {
    const res = await deleteNote(noteId)
    if (res.error) { toast.error(res.error); return }
    const remaining = notes.filter((n) => n.id !== noteId)
    setNotes(remaining)
    if (selectedId === noteId) setSelectedId(remaining[0]?.id ?? null)
    toast.success("Note deleted")
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        // undo handled inside canvas
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const currentCanvasData: CanvasData = React.useMemo(() => {
    if (!selectedNote?.canvasData) return { strokes: [] }
    try { return JSON.parse(selectedNote.canvasData) as CanvasData }
    catch { return { strokes: [] } }
  }, [selectedNote?.id]) // only re-parse on note change, not on every canvas update

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left panel: notes list ── */}
      <div className="flex flex-col w-72 shrink-0 border-r border-border bg-sidebar overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <StickyNote className="size-4 text-primary" />
            <h1 className="text-sm font-semibold text-foreground">Notes</h1>
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="size-7" onClick={handleCreate}>
                <Plus className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New note (Ctrl+N)</TooltipContent>
          </Tooltip>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes…"
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
              <StickyNote className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center">
                {search ? "No notes match your search" : "No notes yet.\nClick + to create your first note."}
              </p>
              {!search && (
                <Button size="sm" variant="outline" onClick={handleCreate} className="h-7 text-xs">
                  <Plus className="size-3.5" /> New note
                </Button>
              )}
            </div>
          ) : (
            <>
              {filtered.some((n) => n.isPinned) && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 pt-1">
                  Pinned
                </p>
              )}
              {filtered.filter((n) => n.isPinned).map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={note.id === selectedId}
                  onSelect={() => setSelectedId(note.id)}
                  onPin={() => handlePin(note)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
              {filtered.some((n) => n.isPinned) && filtered.some((n) => !n.isPinned) && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 pt-2">
                  Notes
                </p>
              )}
              {filtered.filter((n) => !n.isPinned).map((note) => (
                <NoteListItem
                  key={note.id}
                  note={note}
                  isActive={note.id === selectedId}
                  onSelect={() => setSelectedId(note.id)}
                  onPin={() => handlePin(note)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Right panel: editor ── */}
      {selectedNote ? (
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Editor top bar */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background shrink-0">
            {/* Title */}
            <Input
              value={selectedNote.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="flex-1 border-0 bg-transparent px-0 text-base font-semibold shadow-none focus-visible:ring-0 h-8"
              placeholder="Untitled Note"
            />

            {/* Save indicator */}
            {isSaving && (
              <span className="text-xs text-muted-foreground animate-pulse">Saving…</span>
            )}

            {/* Colour picker */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 p-1.5 rounded-md hover:bg-muted transition-colors">
                      <span
                        className="size-3.5 rounded-full border border-border"
                        style={{ background: selectedNote.color ?? "transparent" }}
                      />
                      <ChevronDown className="size-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Note colour</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="p-2 w-44">
                <p className="text-[10px] text-muted-foreground font-medium mb-1.5 px-1">Note colour</p>
                <div className="grid grid-cols-4 gap-1.5 mb-1">
                  {NOTE_COLORS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => handleColor(c.value)}
                      className={cn(
                        "size-6 rounded-full border-2 transition-transform hover:scale-110",
                        selectedNote.color === c.value
                          ? "border-primary"
                          : "border-transparent"
                      )}
                      style={{
                        background: c.value ?? "transparent",
                        outline: !c.value ? "1px solid #e2e8f0" : undefined,
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Pin */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handlePin(selectedNote)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    selectedNote.isPinned
                      ? "text-amber-500 bg-amber-50 dark:bg-amber-950/30"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Pin className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{selectedNote.isPinned ? "Unpin" : "Pin note"}</TooltipContent>
            </Tooltip>

            {/* Delete */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete note</TooltipContent>
            </Tooltip>
          </div>

          {/* Tab switcher: Text / Canvas */}
          <div className="flex items-center gap-0 border-b border-border bg-muted/20 px-4 shrink-0">
            <button
              onClick={() => setEditorTab("text")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                editorTab === "text"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Type className="size-3.5" /> Text
            </button>
            <button
              onClick={() => setEditorTab("canvas")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
                editorTab === "canvas"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Pen className="size-3.5" /> Canvas
              {selectedNote.canvasData &&
                (JSON.parse(selectedNote.canvasData) as CanvasData).strokes?.length > 0 && (
                  <span className="ml-1 size-1.5 rounded-full bg-primary inline-block" />
                )}
            </button>
          </div>

          {/* Editor content */}
          <div className="flex-1 overflow-hidden">
            {editorTab === "text" ? (
              <TextEditor
                content={selectedNote.content ?? ""}
                onChange={handleContentChange}
              />
            ) : (
              <DrawingCanvas
                key={selectedNote.id}
                canvasData={currentCanvasData}
                onChange={handleCanvasChange}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center bg-muted/10">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-muted/50">
              <StickyNote className="size-8 text-muted-foreground/40" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">No note selected</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select a note from the list, or create a new one.
              </p>
            </div>
            <Button onClick={handleCreate} className="mt-1">
              <Plus className="size-4" /> New note
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/50 max-w-xs">
            Notes support both typed text and handwritten pen/stylus input — switch between Text and Canvas tabs in any note.
          </p>
        </div>
      )}
    </div>
  )
}
