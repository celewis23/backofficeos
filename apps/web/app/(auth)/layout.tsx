import { Building2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left — branding panel */}
      <div className="relative hidden flex-col justify-between bg-zinc-950 p-12 lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Building2 className="size-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-white">BackOfficeOS</span>
        </div>

        <div className="space-y-4">
          <blockquote className="text-2xl font-medium leading-relaxed text-white">
            "The only tool we need to run the entire business — from proposals to payments to team management."
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-zinc-800" />
            <div>
              <p className="text-sm font-medium text-white">Sarah Chen</p>
              <p className="text-sm text-zinc-400">Founder, Meridian Studio</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600">
          &copy; {new Date().getFullYear()} BackOfficeOS. All rights reserved.
        </p>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </div>

      {/* Right — form area */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary">
              <Building2 className="size-3.5 text-white" />
            </div>
            <span className="font-semibold">BackOfficeOS</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
