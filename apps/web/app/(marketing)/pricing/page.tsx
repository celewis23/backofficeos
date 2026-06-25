import Link from "next/link";
import {
  AppWindow,
  BarChart3,
  Bot,
  BookOpen,
  Check,
  Cpu,
  GraduationCap,
  Headset,
  LayoutTemplate,
  MessageCircle,
  Phone,
  Send,
  Share2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { cn } from "@/lib/utils";

export const metadata = { title: "Pricing — ArcheionOS" };

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for solo founders.",
    cta: "Start free",
    href: "/signup",
    features: [
      "1 user",
      "25 clients",
      "CRM",
      "Invoices",
      "Scheduling",
      "Booking page",
      "1 automation",
    ],
  },
  {
    name: "Launch",
    price: "$99",
    period: "/ month",
    description: "For growing businesses.",
    cta: "Start free trial",
    href: "/signup",
    features: [
      "Up to 5 team members",
      "Unlimited clients",
      "CRM & projects",
      "Scheduling & invoices",
      "Email inbox",
      "Time tracking",
      "Automations & reporting",
    ],
  },
  {
    name: "Growth",
    price: "$249",
    period: "/ month",
    description: "For established businesses.",
    cta: "Start free trial",
    href: "/signup",
    featured: true,
    features: [
      "Everything in Launch",
      "Up to 15 team members",
      "Unlimited automations",
      "AI assistant",
      "Client portal & marketing tools",
      "Inventory & POS integration",
      "CRM integrations & priority support",
    ],
  },
  {
    name: "Scale",
    price: "$499",
    period: "/ month",
    description: "For larger businesses.",
    cta: "Start free trial",
    href: "/signup",
    features: [
      "Everything in Growth",
      "Up to 50 team members",
      "HR & payroll",
      "Advanced permissions & API access",
      "White label & multi-location",
      "Dedicated success manager",
      "Advanced AI & enterprise security",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Unlimited scale, fully tailored.",
    cta: "Contact sales",
    href: "/signup",
    features: [
      "Unlimited users",
      "Custom development",
      "Private infrastructure",
      "Dedicated onboarding & account team",
      "SSO & compliance features",
      "Service level agreement",
    ],
  },
];

const ADD_ONS = [
  { icon: Headset, name: "AI Receptionist" },
  { icon: Bot, name: "AI Sales Assistant" },
  { icon: MessageCircle, name: "AI Customer Support" },
  { icon: Share2, name: "Social Publishing" },
  { icon: Send, name: "Campaign Manager" },
  { icon: Smartphone, name: "SMS" },
  { icon: Phone, name: "Phone System" },
  { icon: LayoutTemplate, name: "Website Builder" },
  { icon: AppWindow, name: "Mobile App" },
  { icon: GraduationCap, name: "Learning Platform" },
  { icon: BookOpen, name: "Knowledge Base" },
  { icon: BarChart3, name: "Advanced Analytics" },
  { icon: Cpu, name: "Custom AI Agents" },
];

const FAQS = [
  {
    q: "Is there really a free plan?",
    a: "Yes — Free covers one user, up to 25 clients, and the core CRM, invoicing, and scheduling tools. No credit card or trial expiration.",
  },
  {
    q: "Can I change plans later?",
    a: "Anytime. Upgrades take effect immediately and you're only charged the prorated difference; downgrades apply at the next billing cycle.",
  },
  {
    q: "Why is pricing based on business size instead of per user?",
    a: "Most companies expect to pay a subscription for the business, not a tax on every new hire. Pricing by plan keeps costs predictable as your team grows.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes — paying annually saves the equivalent of two months on any paid plan.",
  },
  {
    q: "What payment methods do you accept?",
    a: "All major credit and debit cards, processed securely through Stripe.",
  },
];

export default function PricingPage() {
  return (
    <>
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Simple pricing that scales with you
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
          Start free. Upgrade as your team and operations grow — no per-seat surprises.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={cn(
                "flex flex-col",
                plan.featured && "border-primary shadow-md ring-1 ring-primary/20"
              )}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{plan.name}</p>
                  {plan.featured && <Badge>Recommended</Badge>}
                </div>
                <div className="flex items-baseline gap-1 pt-2">
                  <span className="text-3xl font-semibold tracking-tight">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>

              <CardContent className="flex-1 pt-0">
                <ul className="space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.featured ? "default" : "outline"}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Marketplace / Add-ons */}
      <section id="marketplace" className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Expand Your Operating System
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Enable additional modules whenever your business needs them. Build the
            operating system that fits you — not the other way around.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ADD_ONS.map((addOn) => (
              <div
                key={addOn.name}
                className="flex flex-col items-center gap-2.5 rounded-lg border border-border bg-background p-5 text-center"
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <addOn.icon className="size-4.5 text-primary" />
                </div>
                <p className="text-sm font-medium">{addOn.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Frequently asked questions
          </h2>
          <div className="mt-10 space-y-8">
            {FAQS.map((faq) => (
              <div key={faq.q}>
                <p className="font-medium">{faq.q}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
