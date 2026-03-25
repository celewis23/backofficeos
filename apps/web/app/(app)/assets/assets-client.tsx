"use client"

import * as React from "react"
import { toast } from "sonner"
import {
  Folder, FolderOpen, FolderPlus, Upload, Search, Grid3X3, List,
  Image, FileText, Film, FileArchive, File, Tag, X, Link2,
  Download, Trash2, Edit, Move, Globe, Lock, Copy, ChevronRight,
  ChevronDown, Star, MoreHorizontal, Eye, HardDrive,
  CloudUpload, Plus, Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import type { AssetFolder, Asset } from "@backoffice-os/database"
import {
  createFolder, renameFolder, deleteFolder, moveFolder,
  renameAsset, moveAsset, updateAssetTags, updateAssetPublicLink,
  deleteAsset,
} from "./actions"

// ─── Types ────────────────────────────────────────────────────────────────

interface Props {
  folders: AssetFolder[]
  assets: Asset[]
  storageUsedBytes: number
  totalAssets: number
  currentUserId: string
}

type ViewMode = "grid" | "list"

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  video: Film,
  document: FileText,
  font: FileText,
  archive: FileArchive,
  other: File,
}

const PLAN_LIMITS: Record<string, number> = {
  FREE:         1  * 1024 * 1024 * 1024,
  STARTER:      10 * 1024 * 1024 * 1024,
  PROFESSIONAL: 50 * 1024 * 1024 * 1024,
  ENTERPRISE:   500 * 1024 * 1024 * 1024,
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// ─── Folder Tree ─────────────────────────────────────────────────────────

function FolderTreeItem({
  folder, allFolders, assets, level, selectedFolderId, onSelect, onRename, onDelete, onMove,
}: {
  folder: AssetFolder
  allFolders: AssetFolder[]
  assets: Asset[]
  level: number
  selectedFolderId: string | null
  onSelect: (id: string | null) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, newParentId: string | null) => void
}) {
  const children = allFolders.filter((f) => f.parentId === folder.id)
  const assetCount = assets.filter((a) => a.folderId === folder.id).length
  const [open, setOpen] = React.useState(level === 0)
  const isSelected = selectedFolderId === folder.id

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1.5 cursor-pointer text-sm transition-colors select-none",
          isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
        )}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        onClick={() => { onSelect(folder.id); if (children.length > 0) setOpen(!open) }}
      >
        {children.length > 0 ? (
          <button onClick={(e) => { e.stopPropagation(); setOpen(!open) }} className="shrink-0">
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {isSelected && open ? (
          <FolderOpen className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <Folder className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className="flex-1 truncate">{folder.name}</span>
        {assetCount > 0 && (
          <span className="text-[10px] text-muted-foreground">{assetCount}</span>
        )}
        {!folder.isSystemFolder && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRename(folder.id, folder.name) }}>
                <Edit className="h-3.5 w-3.5 mr-2" /> Rename
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMove(folder.id, null) }}>
                <Move className="h-3.5 w-3.5 mr-2" /> Move to root
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(folder.id) }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {open && children.map((child) => (
        <FolderTreeItem
          key={child.id}
          folder={child}
          allFolders={allFolders}
          assets={assets}
          level={level + 1}
          selectedFolderId={selectedFolderId}
          onSelect={onSelect}
          onRename={onRename}
          onDelete={onDelete}
          onMove={onMove}
        />
      ))}
    </div>
  )
}

// ─── Asset Thumbnail ─────────────────────────────────────────────────────

function AssetThumb({ asset, size = 56 }: { asset: Asset; size?: number }) {
  const Icon = FILE_TYPE_ICONS[asset.fileType] ?? File
  if (asset.fileType === "image") {
    return (
      <img
        src={asset.fileUrl}
        alt={asset.name}
        className="object-cover w-full h-full rounded"
        style={{ width: size, height: size }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
      />
    )
  }
  return (
    <div
      className="flex items-center justify-center rounded bg-muted"
      style={{ width: size, height: size }}
    >
      <Icon className="h-6 w-6 text-muted-foreground" />
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────

export function AssetsClient({ folders, assets: initial, storageUsedBytes, totalAssets: _totalAssets, currentUserId: _currentUserId }: Props) {
  const [assets, setAssets] = React.useState(initial)
  const [view, setView] = React.useState<ViewMode>("grid")
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = React.useState<Asset | null>(null)
  const [search, setSearch] = React.useState("")
  const [activeTag, setActiveTag] = React.useState<string | null>(null)
  const [dragging, setDragging] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)

  // Dialogs
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const [newFolderName, setNewFolderName] = React.useState("")
  const [renameOpen, setRenameOpen] = React.useState<{ id: string; type: "folder" | "asset"; name: string } | null>(null)
  const [renameValue, setRenameValue] = React.useState("")
  const [moveAssetOpen, setMoveAssetOpen] = React.useState<Asset | null>(null)
  const [moveTargetId, setMoveTargetId] = React.useState<string>("")
  const [shareOpen, setShareOpen] = React.useState<Asset | null>(null)
  const [sharePublic, setSharePublic] = React.useState(false)
  const [shareExpiry, setShareExpiry] = React.useState("")
  const [sharePassword, setSharePassword] = React.useState("")
  const [importOpen, setImportOpen] = React.useState(false)
  const [importPlatform, setImportPlatform] = React.useState<"google_drive" | "onedrive">("google_drive")
  const [tagInput, setTagInput] = React.useState("")

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Build tag cloud from all assets
  const allTags = React.useMemo(() => {
    const map = new Map<string, number>()
    for (const a of assets) {
      const tags = Array.isArray(a.tags) ? (a.tags as string[]) : []
      for (const t of tags) {
        map.set(t, (map.get(t) ?? 0) + 1)
      }
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }, [assets])

  // Folder tree roots (no parent)
  const brandKitFolder = folders.find((f) => f.name === "Brand Kit" && f.isSystemFolder)
  const rootFolders = folders.filter((f) => !f.parentId && f.id !== brandKitFolder?.id)

  // Filter assets
  const visibleAssets = assets.filter((a) => {
    const inFolder =
      selectedFolderId === null
        ? true
        : a.folderId === selectedFolderId
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.originalName.toLowerCase().includes(search.toLowerCase())
    const matchTag =
      !activeTag ||
      (Array.isArray(a.tags) && (a.tags as string[]).includes(activeTag))
    return inFolder && matchSearch && matchTag
  })

  async function handleUploadFiles(files: FileList | File[]) {
    const fileArr = Array.from(files)
    if (fileArr.length === 0) return
    setUploading(true)
    let uploaded = 0

    for (const file of fileArr) {
      const fd = new FormData()
      fd.append("file", file)
      if (selectedFolderId) fd.append("folderId", selectedFolderId)
      try {
        const res = await fetch("/api/assets/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.asset) {
          setAssets((prev) => [data.asset, ...prev])
          uploaded++
        }
      } catch {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    if (uploaded > 0) toast.success(`Uploaded ${uploaded} file${uploaded > 1 ? "s" : ""}`)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragging(true)
  }
  function handleDragLeave() { setDragging(false) }
  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) {
      await handleUploadFiles(e.dataTransfer.files)
    }
  }

  async function handleNewFolder() {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim(), selectedFolderId ?? undefined)
    setNewFolderOpen(false)
    setNewFolderName("")
    window.location.reload()
  }

  async function handleRenameSubmit() {
    if (!renameOpen || !renameValue.trim()) return
    if (renameOpen.type === "folder") {
      await renameFolder(renameOpen.id, renameValue.trim())
    } else {
      await renameAsset(renameOpen.id, renameValue.trim())
      setAssets((prev) => prev.map((a) => a.id === renameOpen.id ? { ...a, name: renameValue.trim() } : a))
      if (selectedAsset?.id === renameOpen.id) setSelectedAsset((a) => a ? { ...a, name: renameValue.trim() } : a)
    }
    setRenameOpen(null)
    if (renameOpen.type === "folder") window.location.reload()
  }

  async function handleMoveAsset() {
    if (!moveAssetOpen) return
    await moveAsset(moveAssetOpen.id, moveTargetId || null)
    setAssets((prev) => prev.map((a) => a.id === moveAssetOpen.id ? { ...a, folderId: moveTargetId || null } : a))
    setMoveAssetOpen(null)
  }

  async function handleDeleteAsset(id: string) {
    if (!confirm("Delete this asset? This cannot be undone.")) return
    await deleteAsset(id)
    setAssets((prev) => prev.filter((a) => a.id !== id))
    if (selectedAsset?.id === id) setSelectedAsset(null)
    toast.success("Asset deleted")
  }

  async function handleDeleteFolder(id: string) {
    if (!confirm("Delete this folder? Assets inside will be moved to root.")) return
    await deleteFolder(id)
    window.location.reload()
  }

  async function handleSaveShare() {
    if (!shareOpen) return
    await updateAssetPublicLink(shareOpen.id, {
      isPublic: sharePublic,
      expiresAt: shareExpiry || null,
      password: sharePassword || null,
    })
    setAssets((prev) => prev.map((a) => a.id === shareOpen.id ? { ...a, isPublic: sharePublic } : a))
    if (selectedAsset?.id === shareOpen.id) setSelectedAsset((a) => a ? { ...a, isPublic: sharePublic } : a)
    toast.success("Share settings saved")
    setShareOpen(null)
  }

  async function handleAddTag() {
    if (!selectedAsset || !tagInput.trim()) return
    const current = Array.isArray(selectedAsset.tags) ? (selectedAsset.tags as string[]) : []
    if (current.includes(tagInput.trim())) return
    const newTags = [...current, tagInput.trim()]
    await updateAssetTags(selectedAsset.id, newTags)
    const updated = { ...selectedAsset, tags: newTags }
    setSelectedAsset(updated)
    setAssets((prev) => prev.map((a) => a.id === selectedAsset.id ? updated : a))
    setTagInput("")
  }

  async function handleRemoveTag(tag: string) {
    if (!selectedAsset) return
    const current = Array.isArray(selectedAsset.tags) ? (selectedAsset.tags as string[]) : []
    const newTags = current.filter((t) => t !== tag)
    await updateAssetTags(selectedAsset.id, newTags)
    const updated = { ...selectedAsset, tags: newTags }
    setSelectedAsset(updated)
    setAssets((prev) => prev.map((a) => a.id === selectedAsset.id ? updated : a))
  }

  function openShare(asset: Asset) {
    setShareOpen(asset)
    setSharePublic(asset.isPublic)
    setShareExpiry(asset.publicExpiresAt ? new Date(asset.publicExpiresAt).toISOString().slice(0, 10) : "")
    setSharePassword("")
  }

  function copyPublicLink(asset: Asset) {
    const url = `${window.location.origin}/api/assets/public/${asset.publicToken}`
    navigator.clipboard.writeText(url)
    toast.success("Link copied to clipboard")
  }

  const storageLimit = PLAN_LIMITS.FREE
  const storagePercent = Math.min(100, (storageUsedBytes / storageLimit) * 100)

  return (
    <div
      className="flex h-full overflow-hidden relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragging && (
        <div className="absolute inset-0 z-50 bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <CloudUpload className="h-12 w-12 text-primary mx-auto mb-2" />
            <p className="text-lg font-semibold text-primary">Drop files to upload</p>
          </div>
        </div>
      )}

      {/* Left sidebar */}
      <aside className="w-52 border-r shrink-0 flex flex-col overflow-hidden">
        <div className="p-3 border-b">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Library</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {/* All assets */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md mx-1 cursor-pointer text-sm transition-colors",
              selectedFolderId === null
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
            onClick={() => setSelectedFolderId(null)}
          >
            <Grid3X3 className="h-3.5 w-3.5 shrink-0" />
            <span>All Assets</span>
            <span className="ml-auto text-[10px]">{assets.length}</span>
          </div>

          {/* Brand Kit pinned */}
          {brandKitFolder && (
            <div className="mt-3 mb-1 px-3">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                <Star className="h-2.5 w-2.5" /> Brand Kit
              </p>
            </div>
          )}
          {brandKitFolder && (
            <FolderTreeItem
              folder={brandKitFolder}
              allFolders={folders}
              assets={assets}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelect={setSelectedFolderId}
              onRename={(id, name) => { setRenameOpen({ id, type: "folder", name }); setRenameValue(name) }}
              onDelete={handleDeleteFolder}
              onMove={(id, pid) => moveFolder(id, pid).then(() => window.location.reload())}
            />
          )}

          {/* User folders */}
          {rootFolders.length > 0 && (
            <div className="mt-3 mb-1 px-3">
              <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">Folders</p>
            </div>
          )}
          {rootFolders.map((f) => (
            <FolderTreeItem
              key={f.id}
              folder={f}
              allFolders={folders}
              assets={assets}
              level={0}
              selectedFolderId={selectedFolderId}
              onSelect={setSelectedFolderId}
              onRename={(id, name) => { setRenameOpen({ id, type: "folder", name }); setRenameValue(name) }}
              onDelete={handleDeleteFolder}
              onMove={(id, pid) => moveFolder(id, pid).then(() => window.location.reload())}
            />
          ))}
        </div>

        {/* Tag cloud */}
        {allTags.length > 0 && (
          <div className="border-t p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Tag className="h-2.5 w-2.5" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {allTags.slice(0, 12).map(([tag, count]) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                    activeTag === tag
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  {tag} <span className="opacity-60">{count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Storage meter */}
        <div className="border-t p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-2.5 w-2.5" /> Storage
            </p>
            <p className="text-[10px] text-muted-foreground">{formatBytes(storageUsedBytes)} / {formatBytes(storageLimit)}</p>
          </div>
          <Progress value={storagePercent} className="h-1" />
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b px-4 py-3 flex items-center gap-2 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 border rounded-md p-0.5">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded", view === "grid" ? "bg-muted" : "hover:bg-muted/50")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded", view === "list" ? "bg-muted" : "hover:bg-muted/50")}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setNewFolderOpen(true)}>
            <FolderPlus className="h-3.5 w-3.5 mr-1" /> New Folder
          </Button>
          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setImportOpen(true)}>
            <CloudUpload className="h-3.5 w-3.5 mr-1" /> Import
          </Button>
          <Button size="sm" className="h-8 text-xs" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.zip,.tar,.gz,.ttf,.otf,.woff,.woff2"
            onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
          />
        </div>

        {/* Active tag filter pill */}
        {activeTag && (
          <div className="px-4 py-2 flex items-center gap-2 border-b bg-muted/30">
            <Tag className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtered by tag:</span>
            <Badge variant="secondary" className="gap-1">
              {activeTag}
              <button onClick={() => setActiveTag(null)}><X className="h-3 w-3" /></button>
            </Badge>
          </div>
        )}

        {/* Empty state */}
        {visibleAssets.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground py-24">
            <CloudUpload className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No assets here yet</p>
            <p className="text-sm mt-1">Drag and drop files or click Upload to get started.</p>
          </div>
        )}

        {/* Grid view */}
        {visibleAssets.length > 0 && view === "grid" && (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {visibleAssets.map((asset) => (
                <div
                  key={asset.id}
                  onClick={() => setSelectedAsset(asset)}
                  className={cn(
                    "group relative rounded-lg border overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:shadow-sm",
                    selectedAsset?.id === asset.id && "border-primary ring-1 ring-primary"
                  )}
                >
                  <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                    <AssetThumb asset={asset} size={120} />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{asset.name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(asset.sizeBytes)}</p>
                  </div>
                  {asset.isPublic && (
                    <div className="absolute top-1.5 right-1.5 bg-green-500/90 rounded-full p-0.5">
                      <Globe className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      className="bg-white/90 rounded-full p-1.5 hover:bg-white"
                      onClick={(e) => { e.stopPropagation(); setSelectedAsset(asset) }}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="bg-white/90 rounded-full p-1.5 hover:bg-white"
                      onClick={(e) => { e.stopPropagation(); openShare(asset) }}
                    >
                      <Link2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="bg-white/90 rounded-full p-1.5 hover:bg-white"
                      onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id) }}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List view */}
        {visibleAssets.length > 0 && view === "list" && (
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground hidden md:table-cell">Tags</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">Size</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {visibleAssets.map((asset) => {
                  const Icon = FILE_TYPE_ICONS[asset.fileType] ?? File
                  const tags = Array.isArray(asset.tags) ? (asset.tags as string[]) : []
                  return (
                    <tr
                      key={asset.id}
                      className={cn(
                        "hover:bg-muted/30 cursor-pointer transition-colors",
                        selectedAsset?.id === asset.id && "bg-primary/5"
                      )}
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded overflow-hidden shrink-0">
                            <AssetThumb asset={asset} size={32} />
                          </div>
                          <div>
                            <p className="font-medium truncate max-w-48">{asset.name}</p>
                            <p className="text-[10px] text-muted-foreground">{asset.originalName}</p>
                          </div>
                          {asset.isPublic && <Globe className="h-3 w-3 text-green-500 shrink-0" />}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 hidden sm:table-cell">
                        <Badge variant="secondary" className="text-[10px] capitalize">{asset.fileType}</Badge>
                      </td>
                      <td className="px-4 py-2.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 3).map((t) => (
                            <span key={t} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full">{t}</span>
                          ))}
                          {tags.length > 3 && <span className="text-[10px] text-muted-foreground">+{tags.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground">{formatBytes(asset.sizeBytes)}</td>
                      <td className="px-4 py-2.5 text-right text-muted-foreground hidden lg:table-cell">
                        {new Date(asset.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setRenameOpen({ id: asset.id, type: "asset", name: asset.name }); setRenameValue(asset.name) }}>
                              <Edit className="h-3.5 w-3.5 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setMoveAssetOpen(asset); setMoveTargetId(asset.folderId ?? "") }}>
                              <Move className="h-3.5 w-3.5 mr-2" /> Move to…
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openShare(asset) }}>
                              <Link2 className="h-3.5 w-3.5 mr-2" /> Share
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild onClick={(e) => e.stopPropagation()}>
                              <a href={asset.fileUrl} download={asset.originalName}>
                                <Download className="h-3.5 w-3.5 mr-2" /> Download
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id) }}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Detail panel */}
      {selectedAsset && (
        <aside className="w-72 border-l shrink-0 flex flex-col overflow-hidden bg-background">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <p className="text-sm font-semibold truncate">{selectedAsset.name}</p>
            <button onClick={() => setSelectedAsset(null)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Preview */}
            <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
              {selectedAsset.fileType === "image" ? (
                <img
                  src={selectedAsset.fileUrl}
                  alt={selectedAsset.name}
                  className="object-contain w-full h-full"
                />
              ) : (
                <div className="text-center">
                  {React.createElement(FILE_TYPE_ICONS[selectedAsset.fileType] ?? File, {
                    className: "h-16 w-16 text-muted-foreground mx-auto",
                  })}
                  <p className="text-xs text-muted-foreground mt-2 uppercase">{selectedAsset.fileType}</p>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="p-4 space-y-3 border-b">
              <dl className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Type</dt>
                  <dd className="font-medium capitalize">{selectedAsset.fileType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Size</dt>
                  <dd className="font-medium">{formatBytes(selectedAsset.sizeBytes)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">MIME</dt>
                  <dd className="font-medium text-xs">{selectedAsset.mimeType}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Uploaded</dt>
                  <dd className="font-medium">{new Date(selectedAsset.createdAt).toLocaleDateString()}</dd>
                </div>
                {selectedAsset.sourceProvider && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Source</dt>
                    <dd className="font-medium capitalize">{selectedAsset.sourceProvider.replace("_", " ")}</dd>
                  </div>
                )}
                {selectedAsset.linkedEntityType && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Linked to</dt>
                    <dd className="font-medium capitalize">{selectedAsset.linkedEntityType}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Tags */}
            <div className="p-4 border-b">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tags</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {(Array.isArray(selectedAsset.tags) ? selectedAsset.tags as string[] : []).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag..."
                  className="h-7 text-xs"
                  onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                />
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={handleAddTag}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Share */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sharing</p>
              <div className="flex items-center gap-2">
                {selectedAsset.isPublic
                  ? <Globe className="h-4 w-4 text-green-500" />
                  : <Lock className="h-4 w-4 text-muted-foreground" />
                }
                <span className="text-sm">{selectedAsset.isPublic ? "Public link active" : "Private"}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => openShare(selectedAsset)}>
                  <Link2 className="h-3 w-3 mr-1" /> {selectedAsset.isPublic ? "Manage" : "Share"}
                </Button>
                {selectedAsset.isPublic && (
                  <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => copyPublicLink(selectedAsset)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Footer actions */}
          <div className="border-t p-3 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
              <a href={selectedAsset.fileUrl} download={selectedAsset.originalName}>
                <Download className="h-3 w-3 mr-1" /> Download
              </a>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive h-8 px-2"
              onClick={() => handleDeleteAsset(selectedAsset.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </aside>
      )}

      {/* Dialogs */}

      {/* New folder */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Folder</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Folder name</Label>
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="e.g. Marketing"
              onKeyDown={(e) => e.key === "Enter" && handleNewFolder()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={handleNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename */}
      <Dialog open={!!renameOpen} onOpenChange={(o) => { if (!o) setRenameOpen(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename {renameOpen?.type === "folder" ? "Folder" : "Asset"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(null)}>Cancel</Button>
            <Button onClick={handleRenameSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move asset */}
      <Dialog open={!!moveAssetOpen} onOpenChange={(o) => { if (!o) setMoveAssetOpen(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move Asset</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Move to folder</Label>
            <Select value={moveTargetId} onValueChange={setMoveTargetId}>
              <SelectTrigger><SelectValue placeholder="Root (no folder)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Root (no folder)</SelectItem>
                {folders.map((f) => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveAssetOpen(null)}>Cancel</Button>
            <Button onClick={handleMoveAsset}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share / public link */}
      <Dialog open={!!shareOpen} onOpenChange={(o) => { if (!o) setShareOpen(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Share Asset</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Public link</Label>
                <p className="text-xs text-muted-foreground">Anyone with the link can view this asset</p>
              </div>
              <button
                onClick={() => setSharePublic(!sharePublic)}
                className={cn(
                  "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                  sharePublic ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform", sharePublic ? "translate-x-4" : "translate-x-0.5")} />
              </button>
            </div>
            {sharePublic && (
              <>
                <div className="space-y-1">
                  <Label>Expires on (optional)</Label>
                  <Input
                    type="date"
                    value={shareExpiry}
                    onChange={(e) => setShareExpiry(e.target.value)}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Password (optional)</Label>
                  <Input
                    type="password"
                    placeholder="Leave empty for no password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                  />
                </div>
                {shareOpen?.isPublic && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1.5">Public link</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs flex-1 truncate">
                        {typeof window !== "undefined" ? `${window.location.origin}/api/assets/public/${shareOpen.publicToken}` : ""}
                      </code>
                      <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={() => shareOpen && copyPublicLink(shareOpen)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareOpen(null)}>Cancel</Button>
            <Button onClick={handleSaveShare}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import from Drive / OneDrive */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Import from Cloud Storage</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "google_drive" as const, name: "Google Drive", logo: "G" },
                  { id: "onedrive" as const, name: "OneDrive", logo: "O" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setImportPlatform(p.id)}
                    className={cn(
                      "flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors",
                      importPlatform === p.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="w-7 h-7 rounded bg-muted flex items-center justify-center font-bold text-xs">{p.logo}</div>
                    {p.name}
                    {importPlatform === p.id && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">Connect your {importPlatform === "google_drive" ? "Google Drive" : "OneDrive"}</p>
              <p>
                To import files, connect your {importPlatform === "google_drive" ? "Google Drive" : "OneDrive"} account in{" "}
                <strong>Settings &rarr; Integrations</strong>. Once connected, files will appear here for you to browse and import.
              </p>
              <p className="text-xs">Imported files are copied into your asset library and keep a reference to the source file.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Close</Button>
            <Button onClick={() => { setImportOpen(false); window.location.href = "/integrations" }}>
              Go to Integrations
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
