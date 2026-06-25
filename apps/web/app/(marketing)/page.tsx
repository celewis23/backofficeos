import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  Globe,
  Inbox,
  KanbanSquare,
  Package,
  Plug,
  Quote,
  Receipt,
  UserCog,
  Users,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { getSession } from "@/lib/auth-server";

export const metadata = { title: "ArcheionOS — The operating system for your business" };

const REPLACES = [
  "Calendly",
  "QuickBooks",
  "HubSpot",
  "Asana",
  "Gusto",
  "Square",
  "Dropbox",
  "Slack threads",
];

const FEATURES = [
  {
    icon: Users,
    title: "CRM & pipeline",
    description: "Track leads from first contact to signed client without losing the thread.",
  },
  {
    icon: Receipt,
    title: "Invoicing & payments",
    description: "Send estimates, collect payments, and get paid faster with built-in billing.",
  },
  {
    icon: KanbanSquare,
    title: "Projects & time tracking",
    description: "Plan the work, track the hours, and turn time into invoices automatically.",
  },
  {
    icon: CalendarClock,
    title: "Scheduling & booking",
    description: "A shared calendar plus public booking pages so clients book themselves in.",
  },
  {
    icon: Workflow,
    title: "Automations & AI",
    description: "Build no-code workflows, automate the busywork, and let AI suggest the next one.",
  },
  {
    icon: Globe,
    title: "Client portal",
    description: "Give every client a branded portal for invoices, files, and messages.",
  },
  {
    icon: Inbox,
    title: "Unified inbox",
    description: "Connect Gmail and Outlook so every client thread lives next to the work.",
  },
  {
    icon: Package,
    title: "Inventory & POS",
    description: "Sync sales from Square, Clover, and Toast and track stock across locations.",
  },
  {
    icon: UserCog,
    title: "HR & payroll",
    description: "Manage your team and run payroll with Gusto, ADP, or Rippling.",
  },
  {
    icon: Plug,
    title: "Integrations",
    description: "Connect the tools you already use — Slack, Zoom, Zapier, and more.",
  },
];

const STEPS = [
  {
    title: "Set up your workspace",
    description: "Import your clients, connect your inbox and calendar, and invite your team.",
  },
  {
    title: "Run the day-to-day",
    description: "Manage leads, projects, invoices, and time tracking in one connected view.",
  },
  {
    title: "Automate the rest",
    description: "Let workflows and AI handle the follow-ups, reminders, and busywork.",
  },
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
            Run your entire business from one place.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            ArcheionOS replaces the CRM, invoicing tool, scheduler, project tracker, and
            half-dozen other apps your team has stitched together — with one connected
            system and the automations to run it.
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

      {/* Replaces */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-10 text-center">
          <p className="text-sm font-medium text-muted-foreground">
            Built to replace the tool stack you're already paying for
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {REPLACES.map((tool) => (
              <span key={tool} className="text-sm text-muted-foreground/70 line-through">
                {tool}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything your business needs, connected
          </h2>
          <p className="mt-4 text-muted-foreground">
            Every module shares the same clients, projects, and data — so nothing falls
            through the cracks between tools.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card key={feature.title} hover>
              <CardContent className="pt-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="size-5 text-primary" />
                </div>
                <h3 className="mt-4 font-semibold">{feature.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              From signup to running the business
            </h2>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={step.title} className="space-y-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <Quote className="mx-auto size-8 text-primary/40" />
        <blockquote className="mt-6 text-2xl font-medium leading-relaxed tracking-tight">
          "The only tool we need to run the entire business — from proposals to payments
          to team management."
        </blockquote>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="size-10 rounded-full bg-muted" />
          <div className="text-left">
            <p className="text-sm font-medium">Sarah Chen</p>
            <p className="text-sm text-muted-foreground">Founder, Meridian Studio</p>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
