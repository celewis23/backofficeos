"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft, Send, Download, Copy, MoreHorizontal, CheckCircle2,
  XCircle, CreditCard, Clock, AlertCircle, FileText, Plus, Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatCurrency, formatDate, initials } from "@/lib/utils"
import { updateInvoiceStatus, recordPayment, duplicateInvoice } from "./actions"
import type { Invoice, InvoiceItem, Client, Payment, InvoiceStatus } from "@backoffice-os/database"

type InvoiceWithRelations = Invoice & {
  client: Pick<Client, "id" | "name" | "email" | "phone" | "avatar" | "address"> | null
  items: InvoiceItem[]
  payments: Payment[]
}

type OrgInfo = { name: string; logo: string | null; metadata: unknown } | null

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ElementType; class: string }> = {
  DRAFT:          { label: "Draft",          icon: FileText,     class: "bg-muted text-muted-foreground border-border" },
  SENT:           { label: "Sent",           icon: Send,         class: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800" },
  VIEWED:         { label: "Viewed",         icon: Clock,        class: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800" },
  PARTIAL:        { label: "Partial",        icon: CreditCard,   class: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800" },
  PAID:           { label: "Paid",           icon: CheckCircle2, class: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800" },
  OVERDUE:        { label: "Overdue",        icon: AlertCircle,  class: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800" },
  VOID:           { label: "Void",           icon: XCircle,      class: "bg-muted text-muted-foreground border-border" },
  UNCOLLECTIBLE:  { label: "Uncollectible",  icon: XCircle,      class: "bg-muted text-muted-foreground border-border" },
}

export function InvoiceDetail({ invoice, org }: { invoice: InvoiceWithRelations; org: OrgInfo }) {
  const router = useRouter()
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false)
  const [loading, setLoading] = React.useState<string | null>(null)

  const status = STATUS_CONFIG[invoice.status]
  const StatusIcon = status.icon

  const subtotal = Number(invoice.subtotal)
  const taxAmount = Number(invoice.taxAmount)
  const discount = Number(invoice.discount)
  const total = Number(invoice.total)
  const amountPaid = Number(invoice.amountPaid)
  const amountDue = Number(invoice.amountDue)

  async function handleMarkSent() {
    setLoading("send")
    const res = await updateInvoiceStatus(invoice.id, "SENT")
    setLoading(null)
    if (res.error) toast.error(res.error)
    else toast.success("Invoice marked as sent")
  }

  async function handleMarkPaid() {
    setLoading("paid")
    const res = await updateInvoiceStatus(invoice.id, "PAID")
    setLoading(null)
    if (res.error) toast.error(res.error)
    else toast.success("Invoice marked as paid")
  }

  async function handleVoid() {
    setLoading("void")
    const res = await updateInvoiceStatus(invoice.id, "VOID")
    setLoading(null)
    if (res.error) toast.error(res.error)
    else toast.success("Invoice voided")
  }

  async function handleDuplicate() {
    setLoading("dup")
    const res = await duplicateInvoice(invoice.id)
    setLoading(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Invoice duplicated")
      router.push(`/billing/invoices/${res.invoiceId}`)
    }
  }

  const isPaid = invoice.status === "PAID" || invoice.status === "VOID"

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/billing">
            <Button variant="ghost" size="icon" className="size-8">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{invoice.number}</h1>
              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${status.class}`}>
                <StatusIcon className="size-3" />
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Issued {formatDate(invoice.issueDate)}
              {invoice.dueDate && ` · Due ${formatDate(invoice.dueDate)}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {invoice.status === "DRAFT" && (
            <Button
              size="sm"
              className="gap-1.5"
              loading={loading === "send"}
              onClick={handleMarkSent}
            >
              <Send className="size-3.5" />
              Send invoice
            </Button>
          )}
          {(invoice.status === "SENT" || invoice.status === "VIEWED" || invoice.status === "OVERDUE" || invoice.status === "PARTIAL") && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
              loading={loading === "paid"}
              onClick={handleMarkPaid}
            >
              <CheckCircle2 className="size-3.5" />
              Mark as paid
            </Button>
          )}
          {!isPaid && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <CreditCard className="size-3.5" />
              Record payment
            </Button>
          )}
          <Button variant="outline" size="icon" className="size-8">
            <Download className="size-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="size-8">
                <MoreHorizontal className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={handleDuplicate} disabled={loading === "dup"}>
                <Copy className="size-3.5 mr-2" />
                Duplicate
              </DropdownMenuItem>
              {!isPaid && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={handleVoid}
                    disabled={loading === "void"}
                  >
                    <XCircle className="size-3.5 mr-2" />
                    Void invoice
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-muted/20">
        <div className="max-w-3xl mx-auto py-8 px-4">
          {/* Invoice card */}
          <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
            {/* Invoice header */}
            <div className="p-8 pb-6">
              <div className="flex items-start justify-between mb-8">
                {/* From (org) */}
                <div className="flex items-center gap-3">
                  {org?.logo ? (
                    <img src={org.logo} alt={org.name} className="h-10 w-auto object-contain" />
                  ) : (
                    <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="size-5 text-primary" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{org?.name ?? "Your Company"}</p>
                  </div>
                </div>

                {/* Invoice label */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">INVOICE</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{invoice.number}</p>
                </div>
              </div>

              {/* Dates + Bill To row */}
              <div className="grid grid-cols-3 gap-8">
                <div className="col-span-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Bill to</p>
                  {invoice.client ? (
                    <div>
                      <Link
                        href={`/clients/${invoice.client.id}`}
                        className="font-semibold text-sm text-foreground hover:underline"
                      >
                        {invoice.client.name}
                      </Link>
                      {invoice.client.email && (
                        <p className="text-xs text-muted-foreground">{invoice.client.email}</p>
                      )}
                      {invoice.client.phone && (
                        <p className="text-xs text-muted-foreground">{invoice.client.phone}</p>
                      )}
                      {invoice.client.address && (
                        <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-line">
                          {invoice.client.address as string}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">—</p>
                  )}
                </div>

                <div className="col-span-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Issue date</p>
                    <p className="text-sm text-foreground">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Due date</p>
                    <p className={`text-sm font-medium ${invoice.status === "OVERDUE" ? "text-destructive" : "text-foreground"}`}>
                      {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                    </p>
                  </div>
                  {invoice.paidAt && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Paid on</p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        {formatDate(invoice.paidAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Line items */}
            <div className="px-8 py-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground pb-2 w-[50%]">
                      Description
                    </th>
                    <th className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground pb-2 w-[15%]">
                      Qty
                    </th>
                    <th className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground pb-2 w-[17%]">
                      Unit price
                    </th>
                    <th className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground pb-2 w-[18%]">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 pr-4 text-foreground">{item.description}</td>
                      <td className="py-3 text-right text-muted-foreground">
                        {Number(item.quantity)}
                      </td>
                      <td className="py-3 text-right text-muted-foreground">
                        {formatCurrency(Number(item.unitPrice), invoice.currency)}
                      </td>
                      <td className="py-3 text-right font-medium text-foreground">
                        {formatCurrency(Number(item.amount), invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Separator />

            {/* Totals */}
            <div className="px-8 py-6">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">{formatCurrency(subtotal, invoice.currency)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-green-600 dark:text-green-400">
                        −{formatCurrency(discount, invoice.currency)}
                      </span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Tax ({Number(invoice.taxRate)}%)
                      </span>
                      <span className="text-foreground">{formatCurrency(taxAmount, invoice.currency)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span className="text-lg">{formatCurrency(total, invoice.currency)}</span>
                  </div>
                  {amountPaid > 0 && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Amount paid</span>
                        <span className="text-green-600 dark:text-green-400">
                          −{formatCurrency(amountPaid, invoice.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm border-t border-border pt-2">
                        <span>Balance due</span>
                        <span className={amountDue > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}>
                          {formatCurrency(amountDue, invoice.currency)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Notes / Terms */}
            {(invoice.notes || invoice.terms) && (
              <>
                <Separator />
                <div className="px-8 py-6 grid grid-cols-2 gap-6">
                  {invoice.notes && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Notes</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.notes}</p>
                    </div>
                  )}
                  {invoice.terms && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">Terms</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{invoice.terms}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Payment history */}
          {invoice.payments.length > 0 && (
            <div className="mt-6 bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold">Payment history</h2>
              </div>
              <div className="divide-y divide-border">
                {invoice.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {formatCurrency(Number(payment.amount), invoice.currency)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {payment.method.replace("_", " ")} · {payment.paidAt ? formatDate(payment.paidAt) : "—"}
                          {payment.reference && ` · Ref: ${payment.reference}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">
                      Received
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoiceId={invoice.id}
        amountDue={amountDue}
        currency={invoice.currency}
      />
    </div>
  )
}

function RecordPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  amountDue,
  currency,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  invoiceId: string
  amountDue: number
  currency: string
}) {
  const [loading, setLoading] = React.useState(false)
  const [amount, setAmount] = React.useState(amountDue.toFixed(2))
  const [method, setMethod] = React.useState("BANK_TRANSFER")
  const [reference, setReference] = React.useState("")
  const [paidAt, setPaidAt] = React.useState(new Date().toISOString().split("T")[0])

  React.useEffect(() => {
    if (open) setAmount(amountDue.toFixed(2))
  }, [open, amountDue])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await recordPayment({
      invoiceId,
      amount: parseFloat(amount),
      method,
      reference: reference || undefined,
      paidAt,
    })
    setLoading(false)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success("Payment recorded")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Amount ({currency})</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Payment method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
                <SelectItem value="SQUARE">Square</SelectItem>
                <SelectItem value="CHECK">Check</SelectItem>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              type="date"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Reference <span className="text-muted-foreground">(optional)</span></Label>
            <Input
              placeholder="Transaction ID, check number..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Record payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
