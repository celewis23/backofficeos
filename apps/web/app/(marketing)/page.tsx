import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Megaphone,
  MessageSquare,
  Settings2,
  Target,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getSession } from "@/lib/auth-server";

export const metadata = {
  title: "ArcheionOS — Your Business. One Operating System.",
};

const REPLACES = [
  "CRM",
  "Scheduling",
  "Invoicing",
  "Project Management",
  "Client Portal",
  "Internal Communication",
  "File Storage",
  "Email Management",
  "Team Collaboration",
  "AI Workflows",
  "Marketing Tools",
];

const DEPARTMENTS = [
  {
    icon: Target,
    name: "Sales",
    items: ["CRM", "Pipeline", "Quotes", "Lead Management", "Follow Ups", "Customer History"],
    description: "Every lead and customer record lives in one place — no exporting, no duplicate entry.",
  },
  {
    icon: Settings2,
    name: "Operations",
    items: ["Projects", "Tasks", "Scheduling", "Calendar", "Time Tracking", "Workflows"],
    description: "Plan the work and run it without bouncing between five different tools.",
  },
  {
    icon: Wallet,
    name: "Finance",
    items: ["Invoices", "Payments", "Expenses", "Estimates", "Reporting"],
    description: "Billing and reporting pull from the same data as sales and operations.",
  },
  {
    icon: MessageSquare,
    name: "Customer Experience",
    items: ["Client Portal", "Messaging", "Bookings", "Documents", "Support"],
    description: "Clients get one branded portal — not a different login for every interaction.",
  },
  {
    icon: Megaphone,
    name: "Marketing",
    items: ["Campaigns", "Forms", "Email Marketing", "Automation", "AI Content"],
    description: "Marketing runs on the same customer data as sales — no list syncing required.",
  },
  {
    icon: UsersRound,
    name: "Team",
    items: ["HR", "Payroll", "Inventory", "POS", "Permissions"],
    description: "Manage your people and your operations from the same system.",
  },
];

const PHASES = [
  {
    title: "Set Up",
    description: "Import your business — clients, calendar, inbox, and team — in one pass.",
  },
  {
    title: "Operate",
    description: "Run sales, projects, billing, and support from a single connected view.",
  },
  {
    title: "Automate",
    description: "Let AI and workflows take over the repetitive work across every department.",
  },
  {
    title: "Grow",
    description: "Scale your company without bolting on another disconnected subscription.",
  },
];

const TRUST_STATEMENTS = [
  "Designed for modern service businesses.",
  "Built to replace 10+ business subscriptions.",
  "Runs your sales, operations, finance, and customer communication from one place.",
];

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/2 size-[40rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-6 pt-24 pb-16 text-center sm:pt-32">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
            Your Business.
            <br />
            One Operating System.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            ArcheionOS replaces your CRM, scheduling, invoicing, project management, client
            portal, internal communication, file storage, email, and marketing tools — with
            one connected system built on a single customer record.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button size="xl" asChild>
              <Link href="/signup">
                Start free <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="xl" variant="outline" asChild>
              <Link href="/pricing">See pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required &middot; Free plan available
          </p>
        </div>
      </section>

      {/* Replace the stack */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything These Apps Do — In One Platform
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Stop paying for a different subscription for every part of your business.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
            {REPLACES.map((tool) => (
              <span
                key={tool}
                className="rounded-full border border-border bg-background px-3.5 py-1.5 text-sm text-muted-foreground"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Departments */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            One Platform. Every Department.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Not a bundle of separate tools — every department reads and writes to the same
            data.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEPARTMENTS.map((dept) => (
            <Card key={dept.name} hover>
              <CardContent className="pt-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <dept.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{dept.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{dept.items.join(" · ")}</p>
                <p className="mt-3 text-sm text-muted-foreground/80">{dept.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-lg font-medium tracking-tight">
            One shared database. One customer record.
          </p>
          <p className="mt-2 text-muted-foreground">
            No duplicate records. No syncing between apps. No disconnected workflows.
          </p>
        </div>
      </section>

      {/* Workflow */}
      <section id="how-it-works" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Set Up. Operate. Automate. Grow.
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PHASES.map((phase, i) => (
              <div key={phase.title} className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{phase.title}</h3>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust statements */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {TRUST_STATEMENTS.map((statement) => (
            <p key={statement} className="text-center text-lg font-medium tracking-tight">
              {statement}
            </p>
          ))}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
