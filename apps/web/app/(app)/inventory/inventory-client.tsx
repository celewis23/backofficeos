"use client"

import * as React from "react"
import {
  Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp,
  MoreHorizontal, Edit, Trash2, ArrowUpDown, History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createInventoryItem, updateInventoryItem, deleteInventoryItem, addInventoryMovement } from "./actions"
import type { InventoryItem, InventoryMovement } from "@backoffice-os/database"

type ItemWithMovements = InventoryItem & { movements: InventoryMovement[] }

interface Props {
  items: ItemWithMovements[]
  stats: { totalItems: number; lowStockCount: number }
}

const MOVE_TYPES = [
  { value: "RESTOCK", label: "Restock" },
  { value: "SALE", label: "Sale" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
  { value: "TRANSFER", label: "Transfer" },
] as const

export function InventoryClient({ items: initial, stats }: Props) {
  const [items, setItems] = React.useState(initial)
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")
  const [stockFilter, setStockFilter] = React.useState("all")
  const [addOpen, setAddOpen] = React.useState(false)
  const [editItem, setEditItem] = React.useState<ItemWithMovements | null>(null)
  const [moveItem, setMoveItem] = React.useState<ItemWithMovements | null>(null)
  const [historyItem, setHistoryItem] = React.useState<ItemWithMovements | null>(null)
  const [saving, setSaving] = React.useState(false)

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[]

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku?.toLowerCase().includes(search.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(search.toLowerCase())
    const matchCat = categoryFilter === "all" || item.category === categoryFilter
    const matchStock =
      stockFilter === "all" ||
      (stockFilter === "low" && item.stockQuantity <= item.lowStockThreshold) ||
      (stockFilter === "ok" && item.stockQuantity > item.lowStockThreshold)
    return matchSearch && matchCat && matchStock
  })

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const data = {
      name: fd.get("name") as string,
      sku: fd.get("sku") as string || undefined,
      barcode: fd.get("barcode") as string || undefined,
      category: fd.get("category") as string || undefined,
      costPrice: fd.get("costPrice") ? Number(fd.get("costPrice")) : undefined,
      sellPrice: fd.get("sellPrice") ? Number(fd.get("sellPrice")) : undefined,
      stockQuantity: Number(fd.get("stockQuantity") || 0),
      lowStockThreshold: Number(fd.get("lowStockThreshold") || 5),
      unit: fd.get("unit") as string || undefined,
    }
    const result = editItem
      ? await updateInventoryItem(editItem.id, data)
      : await createInventoryItem(data)
    setSaving(false)
    if (result.error) { alert(result.error); return }
    setAddOpen(false)
    setEditItem(null)
    window.location.reload()
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this item from inventory?")) return
    await deleteInventoryItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleMove(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!moveItem) return
    setSaving(true)
    const fd = new FormData(e.currentTarget)
    const type = fd.get("type") as string
    const rawQty = Number(fd.get("quantity") || 0)
    const quantityChange = ["SALE", "TRANSFER"].includes(type) ? -Math.abs(rawQty) : Math.abs(rawQty)
    const result = await addInventoryMovement({
      itemId: moveItem.id,
      type,
      quantityChange,
      notes: fd.get("notes") as string || undefined,
    })
    setSaving(false)
    if (result.error) { alert(result.error); return }
    setMoveItem(null)
    window.location.reload()
  }

  const activeForm = addOpen || editItem !== null

  return (
    <div className="flex flex-col h-full">
      <div className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            {stats.totalItems} items · {stats.lowStockCount > 0 && (
              <span className="text-amber-500">{stats.lowStockCount} low stock</span>
            )}
            {stats.lowStockCount === 0 && "All stocked"}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="p-6 flex flex-col gap-4 flex-1 overflow-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Items" value={stats.totalItems} icon={Package} />
          <StatCard
            label="Low Stock"
            value={stats.lowStockCount}
            icon={AlertTriangle}
            className={stats.lowStockCount > 0 ? "border-amber-200 dark:border-amber-800" : ""}
          />
          <StatCard
            label="Total Units"
            value={items.reduce((s, i) => s + i.stockQuantity, 0)}
            icon={ArrowUpDown}
          />
          <StatCard
            label="Categories"
            value={categories.length}
            icon={Package}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stockFilter} onValueChange={setStockFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Stock" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
              <SelectItem value="ok">In Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-24 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No items found</p>
            <p className="text-sm">Add your first inventory item to get started.</p>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Item</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">SKU</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                  <th className="text-right px-4 py-3 font-medium">Stock</th>
                  <th className="text-right px-4 py-3 font-medium hidden md:table-cell">Sell Price</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((item) => {
                  const isLow = item.stockQuantity <= item.lowStockThreshold
                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">
                        {item.sku || "—"}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {item.category ? (
                          <Badge variant="secondary">{item.category}</Badge>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("font-medium", isLow && "text-amber-500")}>
                          {item.stockQuantity}
                          {item.unit ? ` ${item.unit}` : ""}
                        </span>
                        {isLow && <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        {item.sellPrice ? `$${Number(item.sellPrice).toFixed(2)}` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditItem(item)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setMoveItem(item)}>
                              <ArrowUpDown className="h-4 w-4 mr-2" /> Adjust Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setHistoryItem(item)}>
                              <History className="h-4 w-4 mr-2" /> Movement History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove
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
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={activeForm} onOpenChange={(o) => { if (!o) { setAddOpen(false); setEditItem(null) } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit Item" : "Add Inventory Item"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Name *</Label>
                <Input name="name" required defaultValue={editItem?.name} />
              </div>
              <div className="space-y-1">
                <Label>SKU</Label>
                <Input name="sku" defaultValue={editItem?.sku ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Barcode</Label>
                <Input name="barcode" defaultValue={editItem?.barcode ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <Input name="category" defaultValue={editItem?.category ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input name="unit" placeholder="e.g. pcs, kg, L" defaultValue={editItem?.unit ?? ""} />
              </div>
              <div className="space-y-1">
                <Label>Cost Price ($)</Label>
                <Input name="costPrice" type="number" step="0.01" min="0" defaultValue={editItem?.costPrice ? String(editItem.costPrice) : ""} />
              </div>
              <div className="space-y-1">
                <Label>Sell Price ($)</Label>
                <Input name="sellPrice" type="number" step="0.01" min="0" defaultValue={editItem?.sellPrice ? String(editItem.sellPrice) : ""} />
              </div>
              <div className="space-y-1">
                <Label>Stock Quantity</Label>
                <Input name="stockQuantity" type="number" min="0" defaultValue={editItem?.stockQuantity ?? 0} />
              </div>
              <div className="space-y-1">
                <Label>Low Stock Threshold</Label>
                <Input name="lowStockThreshold" type="number" min="0" defaultValue={editItem?.lowStockThreshold ?? 5} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditItem(null) }}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog open={!!moveItem} onOpenChange={(o) => { if (!o) setMoveItem(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adjust Stock — {moveItem?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleMove} className="space-y-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select name="type" defaultValue="RESTOCK">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOVE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Quantity</Label>
              <Input name="quantity" type="number" min="1" required defaultValue={1} />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Input name="notes" placeholder="Optional note..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setMoveItem(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Apply"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement History */}
      <Dialog open={!!historyItem} onOpenChange={(o) => { if (!o) setHistoryItem(null) }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Movement History — {historyItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {historyItem?.movements.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No movements recorded yet.</p>
            )}
            {historyItem?.movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm border rounded-lg px-3 py-2">
                <div>
                  <span className="font-medium">{m.type}</span>
                  {m.notes && <span className="text-muted-foreground ml-2">— {m.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("font-mono font-medium", m.quantityChange > 0 ? "text-green-600" : "text-red-500")}>
                    {m.quantityChange > 0 ? "+" : ""}{m.quantityChange}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryItem(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, className,
}: {
  label: string
  value: number
  icon: React.ElementType
  className?: string
}) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  )
}
