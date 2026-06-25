import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-950 px-8 py-16 text-center sm:px-16">
        <div className="absolute -top-24 -right-24 size-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        <h2 className="relative text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Stop paying for ten tools to run one business.
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-zinc-400">
          Bring your clients, projects, billing, and team into one connected system.
          Free to start — no credit card required.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/signup">Start free</Link>
          </Button>
          <Button size="lg" variant="outline" className="border-zinc-700 bg-transparent text-white hover:bg-white/10" asChild>
            <Link href="/pricing">See pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
