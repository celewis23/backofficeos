import Link from "next/link";
import { Check } from "lucide-react";
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
    description: "For solo operators getting started.",
    cta: "Start free",
    href: "/signup",
    features: [
      "1 user",
      "Up to 25 clients",
      "Invoicing & estimates",
      "CRM & pipeline",
      "Calendar & public booking page",
      "1 active automation",
    ],
  },
  {
    name: "Starter",
    price: "$29",
    period: "/ user / mo",
    description: "For small teams ready to grow.",
    cta: "Start free trial",
    href: "/signup",
    features: [
      "Everything in Free",
      "Up to 5 users",
      "Unlimited clients",
      "Projects & time tracking",
      "10 active automations",
      "Connected email inbox",
    ],
  },
  {
    name: "Professional",
    price: "$79",
    period: "/ user / mo",
    description: "For growing studios and agencies.",
    cta: "Start free trial",
    href: "/signup",
    featured: true,
    features: [
      "Everything in Starter",
      "Unlimited users & automations",
      "AI automation suggestions",
      "Branded client portal",
      "Inventory & POS sync",
      "CRM integrations (HubSpot, Salesforce)",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For larger teams with complex needs.",
    cta: "Contact sales",
    href: "/signup",
    features: [
      "Everything in Professional",
      "HR & payroll integrations",
      "SSO & audit logs",
      "Dedicated onboarding",
      "Priority support & SLA",
    ],
  },
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
    q: "Do you offer annual billing?",
    a: "Yes — paying annually saves the equivalent of two months on Starter and Professional plans.",
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
          Start free. Upgrade when you're ready to add teammates, automations, and
          integrations.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 lg:grid-cols-4">
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
                  {plan.featured && <Badge>Most popular</Badge>}
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

      <section className="border-t border-border bg-muted/30">
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
