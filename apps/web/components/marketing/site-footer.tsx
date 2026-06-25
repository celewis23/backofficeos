import Link from "next/link";
import { Building2 } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#features", label: "Features" },
      { href: "/pricing", label: "Pricing" },
      { href: "/pricing#marketplace", label: "Add-ons" },
      { href: "/#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/signup", label: "Get started" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
                <Building2 className="size-3.5 text-white" />
              </div>
              <span className="font-semibold">ArcheionOS</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The Business Operating System — replacing your entire software stack with
              one connected platform.
            </p>
          </div>

          <div className="flex gap-12">
            {COLUMNS.map((col) => (
              <div key={col.title} className="space-y-3">
                <p className="text-sm font-medium">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ArcheionOS. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
