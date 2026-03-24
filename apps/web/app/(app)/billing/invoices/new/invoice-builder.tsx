"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Trash2, ArrowLeft, Send, Save, GripVertical, Package } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { formatCurrency } from "@/lib/utils"
import { createInvoice } from "./actions"

const lineItemSchema = z.object({
  description: z.string().min(1, "Required"),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
  taxable: z.boolean().default(true),
})

const schema = z.object({
  number: z.string().min(1),
  clientId: z.string().optional(),
  issueDate: z.string(),
  dueDate: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Add at least one item"),
  taxRate: z.coerce.number().min(0).max(100).default(0),
  discount: z.coerce.number().min(0).default(0),
  notes: z.string().optional(),
  terms: z.string().optional(),
  currency: z.string().default("USD"),
})

type FormValues = z.infer<typeof schema>

interface InvoiceBuilderProps {
  clients: { id: string; name: string; email?: string | null; currency?: string | null; paymentTerms?: number | null }[]
  defaultClientId?: string
  nextNumber: string
  orgId: string
  catalogItems?: { id: string; name: string; unitPrice: number; unit: string | null; description: string | null }[]
}

export function InvoiceBuilder({
  clients,
  defaultClientId,
  nextNumber,
  orgId,
  catalogItems = [],
}: InvoiceBuilderProps) {
  const router = useRouter()
  const today = new Date().toISOString().split("T")[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      number: nextNumber,
      clientId: defaultClientId ?? "",
      issueDate: today,
      dueDate: addDays(today, 30),
      items: [{ description: "", quantity: 1, unitPrice: 0, taxable: true }],
      taxRate: 0,
      discount: 0,
      currency: "USD",
    },
  })

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "items" })
  const watched = useWatch({ control: form.control })

  const subtotal = (watched.items ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )
  const taxableSubtotal = (watched.items ?? [])
    .filter((item) => item.taxable)
    .reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0)
  const taxAmount = (taxableSubtotal * (Number(watched.taxRate) || 0)) / 100
  const discount = Number(watched.discount) || 0
  const total = subtotal + taxAmount - discount

  async function onSubmit(values: FormValues, action: "draft" | "send") {
    const result = await createInvoice({
      ...values,
      subtotal,
      taxAmount,
      total,
      amountDue: total,
      status: action === "send" ? "SENT" : "DRAFT",
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(action === "send" ? "Invoice sent!" : "Invoice saved as draft")
    router.push(`/billing/invoices/${result.invoiceId}`)
  }

  const selectedClient = clients.find((c) => c.id === watched.clientId)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-semibold text-foreground flex-1">New invoice</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={form.handleSubmit((v) => onSubmit(v, "draft"))}
            disabled={form.formState.isSubmitting}
          >
            <Save className="size-3.5 mr-1.5" />
            Save draft
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={form.handleSubmit((v) => onSubmit(v, "send"))}
            disabled={form.formState.isSubmitting}
          >
            <Send className="size-3.5" />
            Send invoice
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          {/* Invoice meta */}
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label>Invoice number</Label>
              <Input {...form.register("number")} />
            </div>
            <div className="space-y-1.5">
              <Label>Issue date</Label>
              <Input type="date" {...form.register("issueDate")} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" {...form.register("dueDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <Label>Bill to</Label>
              <Select
                value={watched.clientId ?? ""}
                onValueChange={(v) => form.setValue("clientId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient?.email && (
                <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select
                value={watched.currency ?? "USD"}
                onValueChange={(v) => form.setValue("currency", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["USD", "EUR", "GBP", "CAD", "AUD", "JPY"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Line items */}
          <div>
            <div className="grid grid-cols-[1fr_80px_110px_80px_32px] gap-3 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="text-right">Unit price</span>
              <span className="text-right">Amount</span>
              <span />
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => {
                const qty = Number(watched.items?.[index]?.quantity) || 0
                const price = Number(watched.items?.[index]?.unitPrice) || 0
                const amount = qty * price

                return (
                  <div key={field.id} className="grid grid-cols-[1fr_80px_110px_80px_32px] gap-3 items-center group">
                    <Input
                      placeholder="Item description..."
                      {...form.register(`items.${index}.description`)}
                      error={!!form.formState.errors.items?.[index]?.description}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="text-center"
                      {...form.register(`items.${index}.quantity`)}
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        className="pl-6 text-right"
                        {...form.register(`items.${index}.unitPrice`)}
                      />
                    </div>
                    <span className="text-sm font-medium text-right text-foreground">
                      {formatCurrency(amount)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => append({ description: "", quantity: 1, unitPrice: 0, taxable: true })}
              >
                <Plus className="size-3.5" />
                Add line item
              </Button>
              {catalogItems.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Package className="size-3.5" />
                      From catalog
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" align="start">
                    <p className="text-xs font-medium text-muted-foreground px-2 pb-1.5">Select a catalog item</p>
                    <div className="space-y-0.5 max-h-60 overflow-y-auto">
                      {catalogItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
                          onClick={() => append({
                            description: item.name + (item.unit ? ` (per ${item.unit})` : ""),
                            quantity: 1,
                            unitPrice: item.unitPrice,
                            taxable: true,
                          })}
                        >
                          <p className="text-xs font-medium">{item.name}</p>
                          {item.description && (
                            <p className="text-[10px] text-muted-foreground line-clamp-1">{item.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground">{formatCurrency(item.unitPrice)}{item.unit ? ` / ${item.unit}` : ""}</p>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <Separator />

          {/* Totals + notes */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Payment instructions, thank you note, etc."
                  rows={3}
                  {...form.register("notes")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Terms</Label>
                <Textarea
                  placeholder="Late payment policy, etc."
                  rows={2}
                  {...form.register("terms")}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label className="text-muted-foreground text-sm">Tax rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-24 text-right h-8 text-sm"
                  {...form.register("taxRate")}
                />
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(taxAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3">
                <Label className="text-muted-foreground text-sm">Discount ($)</Label>
                <div className="relative w-24">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs pointer-events-none">$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-6 text-right h-8 text-sm"
                    {...form.register("discount")}
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}
