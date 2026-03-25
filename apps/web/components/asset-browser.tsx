"use client"

import * as React from "react"
import { Search, Image, FileText, Film, FileArchive, File, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface AssetItem {
  id: string
  name: string
  fileUrl: string
  fileType: string
  mimeType: string
  sizeBytes: number
}

interface AssetBrowserProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (asset: AssetItem) => void
  title?: string
  accept?: string[] // file types to show: "image" | "document" | etc.
}

const FILE_TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  video: Film,
  document: FileText,
  font: FileText,
  archive: FileArchive,
  other: File,
}

function formatBytes(b: number): string {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export function AssetBrowser({ open, onOpenChange, onSelect, title = "Select Asset", accept }: AssetBrowserProps) {
  const [assets, setAssets] = React.useState<AssetItem[]>([])
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selected, setSelected] = React.useState<AssetItem | null>(null)

  React.useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/assets/list")
      .then((r) => r.json())
      .then((data) => {
        setAssets(data.assets ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [open])

  const filtered = assets.filter((a) => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    const matchType = !accept || accept.includes(a.fileType)
    return matchSearch && matchType
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No assets found</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map((asset) => {
                const Icon = FILE_TYPE_ICONS[asset.fileType] ?? File
                const isSelected = selected?.id === asset.id
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelected(asset)}
                    className={cn(
                      "group relative rounded-lg border overflow-hidden text-left transition-all",
                      isSelected ? "border-primary ring-2 ring-primary ring-offset-1" : "hover:border-primary/50"
                    )}
                  >
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {asset.fileType === "image" ? (
                        <img src={asset.fileUrl} alt={asset.name} className="object-cover w-full h-full" />
                      ) : (
                        <Icon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-medium truncate">{asset.name}</p>
                      <p className="text-[9px] text-muted-foreground">{formatBytes(asset.sizeBytes)}</p>
                    </div>
                    {isSelected && (
                      <div className="absolute top-1 right-1 bg-primary rounded-full p-0.5">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!selected} onClick={() => { if (selected) { onSelect(selected); onOpenChange(false) } }}>
            Use Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
