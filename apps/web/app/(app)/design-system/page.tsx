"use client";

import * as React from "react";
import { Topbar } from "@/components/layout/topbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Mail,
  Settings,
  Trash2,
  Edit,
  ChevronDown,
  Download,
  MoreHorizontal,
  Sparkles,
  Plus,
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

function Section({ title, description, children }: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
      <Separator />
    </section>
  );
}

function ColorSwatch({ name, variable, textClass }: { name: string; variable: string; textClass?: string }) {
  return (
    <div className="space-y-1.5">
      <div
        className={cn("h-12 w-full rounded-lg border border-border/50", variable)}
        title={name}
      />
      <p className="text-[11px] font-medium text-foreground">{name}</p>
    </div>
  );
}

const INVOICE_DATA = [
  { id: "#1042", client: "Greenfield Design", amount: "$3,200", status: "paid",    date: "Mar 20" },
  { id: "#1041", client: "BlueSky Media",     amount: "$1,800", status: "overdue", date: "Mar 6"  },
  { id: "#1040", client: "Northstar Inc",     amount: "$5,600", status: "pending", date: "Mar 22" },
  { id: "#1039", client: "Meridian Studio",   amount: "$2,400", status: "paid",    date: "Mar 15" },
];

const statusBadge = (status: string) => {
  const map: Record<string, "success" | "destructive" | "warning" | "muted"> = {
    paid: "success",
    overdue: "destructive",
    pending: "warning",
    draft: "muted",
  };
  return map[status] ?? "muted";
};

export default function DesignSystemPage() {
  const [switchOn, setSwitchOn] = React.useState(true);
  const [checked, setChecked] = React.useState(false);
  const [progress, setProgress] = React.useState(68);

  return (
    <>
      <Topbar
        breadcrumb={[{ label: "Settings" }, { label: "Design System" }]}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-8 space-y-12">

          {/* Header */}
          <div className="space-y-2 pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h1 className="text-2xl font-bold">ArcheionOS Design System</h1>
            </div>
            <p className="text-muted-foreground">
              The complete component library, color tokens, and design language that powers the platform.
            </p>
          </div>

          {/* ── COLORS ───────────────────────────────────────────────────── */}
          <Section title="Color Tokens" description="All colors adapt to light and dark mode via CSS custom properties.">
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Brand</p>
                <div className="grid grid-cols-4 gap-3">
                  <ColorSwatch name="Primary"   variable="bg-primary" />
                  <ColorSwatch name="Secondary" variable="bg-secondary" />
                  <ColorSwatch name="Accent"    variable="bg-accent" />
                  <ColorSwatch name="Muted"     variable="bg-muted" />
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Semantic</p>
                <div className="grid grid-cols-4 gap-3">
                  <ColorSwatch name="Success"     variable="bg-success" />
                  <ColorSwatch name="Warning"     variable="bg-warning" />
                  <ColorSwatch name="Destructive" variable="bg-destructive" />
                  <ColorSwatch name="Border"      variable="bg-border" />
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Surfaces</p>
                <div className="grid grid-cols-4 gap-3">
                  <ColorSwatch name="Background" variable="bg-background" />
                  <ColorSwatch name="Card"       variable="bg-card" />
                  <ColorSwatch name="Popover"    variable="bg-popover" />
                  <ColorSwatch name="Sidebar"    variable="bg-sidebar" />
                </div>
              </div>
            </div>
          </Section>

          {/* ── TYPOGRAPHY ───────────────────────────────────────────────── */}
          <Section title="Typography" description="Inter Variable with a clear hierarchy. Mono for code and IDs.">
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Display / H1</p>
                <p className="text-4xl font-bold tracking-tight">The Business OS</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">H2 / Page title</p>
                <p className="text-2xl font-bold tracking-tight">Invoice Management</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">H3 / Section</p>
                <p className="text-xl font-semibold">Recent Transactions</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">H4 / Card title</p>
                <p className="text-base font-semibold">Revenue this month</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Body / Default</p>
                <p className="text-sm">A full-featured business operating system built for entrepreneurs and enterprise teams. Everything you need in one place.</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Small / Meta</p>
                <p className="text-xs text-muted-foreground">Invoice #1042 — Created Mar 20, 2026 by Jane Doe</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mono / IDs &amp; Code</p>
                <p className="font-mono text-sm text-muted-foreground">INV-2026-1042 · $3,200.00 USD</p>
              </div>
            </div>
          </Section>

          {/* ── BUTTONS ──────────────────────────────────────────────────── */}
          <Section title="Buttons" description="7 variants × 5 sizes. Loading state included.">
            <div className="space-y-4">
              <div>
                <p className="mb-3 text-xs text-muted-foreground">Variants</p>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="success">Success</Button>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs text-muted-foreground">Sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="xl">Extra Large</Button>
                  <Button size="lg">Large</Button>
                  <Button size="default">Default</Button>
                  <Button size="sm">Small</Button>
                  <Button size="icon"><Settings /></Button>
                  <Button size="icon-sm"><Settings /></Button>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs text-muted-foreground">States</p>
                <div className="flex flex-wrap gap-3">
                  <Button loading>Saving...</Button>
                  <Button disabled>Disabled</Button>
                  <Button>
                    <Download className="size-4" /> Export CSV
                  </Button>
                  <Button variant="outline">
                    <Plus className="size-4" /> New Invoice
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          {/* ── BADGES ───────────────────────────────────────────────────── */}
          <Section title="Badges" description="Status indicators with optional dot prefix.">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="muted">Muted</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Overdue</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="purple">Purple</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" dot>Active</Badge>
                <Badge variant="warning" dot>At Risk</Badge>
                <Badge variant="destructive" dot>Overdue</Badge>
                <Badge variant="muted" dot>Draft</Badge>
                <Badge variant="info" dot>In Review</Badge>
              </div>
            </div>
          </Section>

          {/* ── INPUTS ───────────────────────────────────────────────────── */}
          <Section title="Form Controls" description="Input, Textarea, Select, Checkbox, Switch.">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Email address</Label>
                <Input placeholder="you@company.com" startIcon={<Mail />} />
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <Input placeholder="Search clients..." startIcon={<Search />} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Error state</Label>
                <Input placeholder="Invalid input" error />
                <p className="text-xs text-destructive">This field is required</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea placeholder="Add notes about this client..." rows={3} />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={switchOn} onCheckedChange={setSwitchOn} id="switch-demo" />
                  <Label htmlFor="switch-demo">Email notifications</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="check-demo"
                    checked={checked}
                    onCheckedChange={(v) => setChecked(!!v)}
                  />
                  <Label htmlFor="check-demo">Mark as billable</Label>
                </div>
              </div>
            </div>
          </Section>

          {/* ── CARDS ────────────────────────────────────────────────────── */}
          <Section title="Cards" description="Versatile surface container with header, content, and footer slots.">
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue</CardTitle>
                  <CardDescription>This month</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">$48,250</p>
                </CardContent>
                <CardFooter className="text-xs text-success gap-1">
                  <CheckCircle2 className="size-3.5" /> +12.5% vs last month
                </CardFooter>
              </Card>
              <Card hover>
                <CardHeader>
                  <CardTitle>Active Clients</CardTitle>
                  <CardDescription>Total accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">64</p>
                </CardContent>
                <CardFooter className="text-xs text-muted-foreground">
                  Hover effect enabled
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Hours Tracked</CardTitle>
                  <CardDescription>This billing cycle</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-3xl font-bold">342h</p>
                  <Progress value={progress} />
                  <p className="text-xs text-muted-foreground">{progress}% billable</p>
                </CardContent>
              </Card>
            </div>
          </Section>

          {/* ── AVATARS ──────────────────────────────────────────────────── */}
          <Section title="Avatars" description="5 sizes with image and fallback states.">
            <div className="flex items-end gap-4">
              <Avatar size="xs"><AvatarFallback>XS</AvatarFallback></Avatar>
              <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
              <Avatar size="md"><AvatarFallback>MD</AvatarFallback></Avatar>
              <Avatar size="lg"><AvatarFallback className="bg-primary/20 text-primary">JD</AvatarFallback></Avatar>
              <Avatar size="xl"><AvatarFallback className="bg-success/20 text-success">AB</AvatarFallback></Avatar>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex -space-x-2">
                {["JD", "AB", "CK", "RM"].map((init) => (
                  <Avatar key={init} size="sm" className="border-2 border-background">
                    <AvatarFallback className="text-[10px]">{init}</AvatarFallback>
                  </Avatar>
                ))}
                <div className="flex size-8 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] text-muted-foreground">
                  +8
                </div>
              </div>
              <span className="text-sm text-muted-foreground">12 team members</span>
            </div>
          </Section>

          {/* ── TABLE ────────────────────────────────────────────────────── */}
          <Section title="Table" description="Data table with sortable headers and row states.">
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {INVOICE_DATA.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.id}</TableCell>
                      <TableCell className="font-medium">{row.client}</TableCell>
                      <TableCell className="font-medium">{row.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      <TableCell>
                        <Badge variant={statusBadge(row.status)} dot className="capitalize">
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit className="size-4" /> Edit</DropdownMenuItem>
                            <DropdownMenuItem><Download className="size-4" /> Download</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem destructive><Trash2 className="size-4" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </Section>

          {/* ── TABS ─────────────────────────────────────────────────────── */}
          <Section title="Tabs" description="Segmented content switcher.">
            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="overview">
                <Card><CardContent className="pt-4 text-sm text-muted-foreground">
                  Overview tab content — client details, summary stats, key contacts.
                </CardContent></Card>
              </TabsContent>
              <TabsContent value="activity">
                <Card><CardContent className="pt-4 text-sm text-muted-foreground">
                  Activity feed — emails, calls, meetings, notes, invoices.
                </CardContent></Card>
              </TabsContent>
              <TabsContent value="files">
                <Card><CardContent className="pt-4 text-sm text-muted-foreground">
                  Files — contracts, proposals, shared documents.
                </CardContent></Card>
              </TabsContent>
              <TabsContent value="settings">
                <Card><CardContent className="pt-4 text-sm text-muted-foreground">
                  Client-level settings — billing preferences, notifications.
                </CardContent></Card>
              </TabsContent>
            </Tabs>
          </Section>

          {/* ── PROGRESS ─────────────────────────────────────────────────── */}
          <Section title="Progress" description="4 variants for contextual meaning.">
            <div className="space-y-4 max-w-sm">
              {[
                { label: "Default (78%)",      value: 78,  variant: "default"     as const },
                { label: "Success (100%)",     value: 100, variant: "success"     as const },
                { label: "Warning (45%)",      value: 45,  variant: "warning"     as const },
                { label: "Destructive (12%)",  value: 12,  variant: "destructive" as const },
              ].map(({ label, value, variant }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{label}</span>
                    <span>{value}%</span>
                  </div>
                  <Progress value={value} variant={variant} />
                </div>
              ))}
            </div>
          </Section>

          {/* ── SKELETON ─────────────────────────────────────────────────── */}
          <Section title="Skeletons" description="Loading states — never show an empty, undesigned screen.">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
                <div className="flex gap-2 mt-4">
                  <Skeleton className="h-8 w-24 rounded-md" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* ── DIALOG ───────────────────────────────────────────────────── */}
          <Section title="Dialog" description="Modal dialogs for focused interactions.">
            <div className="flex gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Invoice #1042</DialogTitle>
                    <DialogDescription>
                      This will permanently delete the invoice and remove it from the client record.
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="destructive">Delete Invoice</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button>New Invoice</Button>
                </DialogTrigger>
                <DialogContent size="lg">
                  <DialogHeader>
                    <DialogTitle>Create Invoice</DialogTitle>
                    <DialogDescription>
                      Fill in the details to generate a new invoice for your client.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                      <Label>Client</Label>
                      <Select>
                        <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="greenfield">Greenfield Design</SelectItem>
                          <SelectItem value="northstar">Northstar Inc</SelectItem>
                          <SelectItem value="bluesky">BlueSky Media</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Notes</Label>
                      <Textarea placeholder="Invoice description or notes..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline">Save Draft</Button>
                    <Button>Create Invoice</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Section>

          {/* ── ALERT STATES ─────────────────────────────────────────────── */}
          <Section title="Alert States" description="Empty states, errors, and informational banners.">
            <div className="space-y-3">
              {[
                {
                  icon: CheckCircle2,
                  color: "text-success",
                  bg: "bg-success/10 border-success/20",
                  title: "Payment received",
                  msg: "Invoice #1042 was paid in full. $3,200 has been added to your balance.",
                },
                {
                  icon: AlertCircle,
                  color: "text-warning",
                  bg: "bg-warning/10 border-warning/20",
                  title: "Invoice overdue",
                  msg: "Invoice #1039 from BlueSky Media is 14 days overdue. Send a reminder?",
                },
                {
                  icon: AlertCircle,
                  color: "text-destructive",
                  bg: "bg-destructive/10 border-destructive/20",
                  title: "Stripe disconnected",
                  msg: "Your Stripe integration was disconnected. Reconnect to continue accepting payments.",
                },
                {
                  icon: Info,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10 border-blue-500/20",
                  title: "Trial ends in 7 days",
                  msg: "Add a payment method to keep your workspace active after your trial expires.",
                },
              ].map(({ icon: Icon, color, bg, title, msg }) => (
                <div key={title} className={cn("flex gap-3 rounded-lg border p-4", bg)}>
                  <Icon className={cn("mt-0.5 size-4 shrink-0", color)} />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── EMPTY STATE ──────────────────────────────────────────────── */}
          <Section title="Empty States" description="Placeholder UI for when there is no data.">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mb-4">
                  <Bell className="size-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold mb-1">No notifications yet</h3>
                <p className="text-xs text-muted-foreground max-w-xs mb-4">
                  When there is activity in your workspace — payments, messages, task updates — it will appear here.
                </p>
                <Button variant="outline" size="sm">Configure notifications</Button>
              </CardContent>
            </Card>
          </Section>

        </div>
      </main>
    </>
  );
}
