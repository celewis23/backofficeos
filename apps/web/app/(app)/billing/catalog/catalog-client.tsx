"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Package, Search, Pencil, Trash2, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { createProduct, updateProduct, deleteProduct } from "./actions"

type Product = {
  id: string
  name: string
  description: string | null
  sku: string | null
  type: "SERVICE" | "PRODUCT" | "SUBSCRIPTION"
  unitPrice: string | number
  currency: string
  taxable: boolean
  unit: string | null
  isActive: boolean
  isRecurring: boolean
}

const TYPE_COLORS: Record<string, string> = {
  SERVICE: "bg-blue-500/10 text-blue-600",
  PRODUCT: "bg-green-500/10 text-green-600",
  SUBSCRIPTION: "bg-purple-500/10 text-purple-600",
}

function formatPrice(price: string | number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(price))
}

export function CatalogClient({ products: initial }: { products: Product[] }) {
  const [products, setProducts] = React.useState(initial)
  const [search, setSearch] = React.useState("")
  const [typeFilter, setTypeFilter] = React.useState<string>("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Product | null>(null)
  const [saving, setSaving] = React.useState(false)

  // Form state
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [sku, setSku] = React.useState("")
  const [type, setType] = React.useState<"SERVICE" | "PRODUCT" | "SUBSCRIPTION">("SERVICE")
  const [unitPrice, setUnitPrice] = React.useState("")
  const [unit, setUnit] = React.useState("")
  const [taxable, setTaxable] = React.useState(true)
  const [isRecurring, setIsRecurring] = React.useState(false)

  function openCreate() {
    setEditing(null)
    setName(""); setDescription(""); setSku(""); setType("SERVICE")
    setUnitPrice(""); setUnit(""); setTaxable(true); setIsRecurring(false)
    setDialogOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setName(p.name); setDescription(p.description ?? ""); setSku(p.sku ?? ""); setType(p.type)
    setUnitPrice(String(Number(p.unitPrice))); setUnit(p.unit ?? ""); setTaxable(p.taxable); setIsRecurring(p.isRecurring)
    setDialogOpen(true)
  }

  async function handleSave() {
    setSaving(true)
    const data = { name, description, sku, type, unitPrice: parseFloat(unitPrice), unit, taxable, isRecurring }
    const result = editing ? await updateProduct(editing.id, data) : await createProduct(data)
    setSaving(false)
    if (result.error) { toast.error(result.error); return }
    toast.success(editing ? "Product updated" : "Product created")
    setDialogOpen(false)
    window.location.reload()
  }

  async function handleDelete(id: string) {
    await deleteProduct(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    toast.success("Deleted")
  }

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || p.type === typeFilter
    return matchSearch && matchType && p.isActive
  })

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-sm font-semibold">Product & Service Catalog</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your reusable products and services for invoices</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={openCreate}>
          <Plus className="size-3.5" /> Add Item
        </Button>
      </div>

      <div className="flex items-center gap-3 px-6 py-3 border-b border-border shrink-0">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input className="pl-8 h-8 text-xs" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
            <TabsTrigger value="SERVICE" className="text-xs px-3">Services</TabsTrigger>
            <TabsTrigger value="PRODUCT" className="text-xs px-3">Products</TabsTrigger>
            <TabsTrigger value="SUBSCRIPTION" className="text-xs px-3">Subscriptions</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <Package className="size-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium">No catalog items</p>
            <p className="text-xs text-muted-foreground mt-1">Add products and services to use in invoices</p>
            <Button size="sm" className="mt-4 gap-1.5" onClick={openCreate}><Plus className="size-3.5" /> Add Item</Button>
          </div>
        ) : (
          <div className="p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Name</th>
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Type</th>
                  <th className="text-left pb-3 text-xs font-medium text-muted-foreground">Unit</th>
                  <th className="text-right pb-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-center pb-3 text-xs font-medium text-muted-foreground">Taxable</th>
                  <th className="pb-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-border/50 last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{p.name}</p>
                      {p.sku && <p className="text-xs text-muted-foreground">SKU: {p.sku}</p>}
                      {p.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{p.description}</p>}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", TYPE_COLORS[p.type])}>
                        {p.type}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground">{p.unit || "—"}</td>
                    <td className="py-3 pr-4 text-right font-medium">{formatPrice(p.unitPrice, p.currency)}</td>
                    <td className="py-3 pr-4 text-center">
                      <span className={cn("size-2 inline-block rounded-full", p.taxable ? "bg-green-500" : "bg-muted")} />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(p)}><Pencil className="size-3.5" /></Button>
                        <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="size-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ScrollArea>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Catalog Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Name</Label>
                <Input placeholder="Web Design Package" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SERVICE">Service</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>SKU <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="WDP-001" value={sku} onChange={(e) => setSku(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit price</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit label <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="hour / unit / month" value={unit} onChange={(e) => setUnit(e.target.value)} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
                <Input placeholder="Brief description" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={taxable} onCheckedChange={setTaxable} id="taxable" />
                <Label htmlFor="taxable" className="text-xs">Taxable</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isRecurring} onCheckedChange={setIsRecurring} id="recurring" />
                <Label htmlFor="recurring" className="text-xs">Recurring default</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving || !name || !unitPrice}>
                {saving ? "Saving..." : editing ? "Save changes" : "Add item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
