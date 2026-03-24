"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Building2, Users2, Zap, CheckCircle2,
  ArrowRight, Globe, Clock, Briefcase, Mail,
  BarChart3, Folders, CreditCard, Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { organization } from "@/lib/auth-client"

const STEPS = ["workspace", "team", "modules", "done"] as const
type Step = (typeof STEPS)[number]

const INDUSTRIES = [
  "Agency / Consulting",
  "Software / Tech",
  "Design / Creative",
  "Marketing",
  "Legal / Professional Services",
  "Healthcare",
  "Finance",
  "Real Estate",
  "E-commerce",
  "Education",
  "Construction",
  "Other",
]

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
]

const MODULE_OPTIONS = [
  { id: "billing",   icon: CreditCard, label: "Billing & Invoices",    desc: "Create and send invoices, track payments" },
  { id: "projects",  icon: Folders,    label: "Projects & Tasks",       desc: "Manage projects with Kanban boards" },
  { id: "clients",   icon: Users2,     label: "CRM & Clients",          desc: "Track clients and leads" },
  { id: "inbox",     icon: Inbox,      label: "Inbox",                  desc: "Unified email and communications" },
  { id: "analytics", icon: BarChart3,  label: "Analytics",              desc: "Revenue, project, and team reports" },
  { id: "hr",        icon: Briefcase,  label: "HR & Time Tracking",     desc: "Team management and time entries" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState<Step>("workspace")
  const [loading, setLoading] = React.useState(false)

  // Step 1
  const [industry, setIndustry] = React.useState("")
  const [size, setSize] = React.useState("")
  const [timezone, setTimezone] = React.useState("America/New_York")

  // Step 2
  const [invites, setInvites] = React.useState(["", ""])

  // Step 3
  const [selectedModules, setSelectedModules] = React.useState<string[]>(["billing", "projects", "clients"])

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex) / (STEPS.length - 1)) * 100

  function toggleModule(id: string) {
    setSelectedModules((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    )
  }

  async function handleInvites() {
    const validEmails = invites.filter((e) => e.trim() && e.includes("@"))
    for (const email of validEmails) {
      await organization.inviteMember({ email, role: "member" }).catch(() => null)
    }
  }

  async function handleFinish() {
    setLoading(true)
    await handleInvites()
    router.push("/dashboard")
    router.refresh()
  }

  function next() {
    const next = STEPS[stepIndex + 1]
    if (next) setStep(next)
  }

  return (
    <div className="w-full max-w-lg">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 justify-center">
        <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="size-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">BackOfficeOS</span>
      </div>

      {/* Progress */}
      {step !== "done" && (
        <div className="mb-6">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={false}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Step {stepIndex + 1} of {STEPS.length - 1}
          </p>
        </div>
      )}

      {/* Card */}
      <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-8"
          >
            {step === "workspace" && (
              <WorkspaceStep
                industry={industry}
                setIndustry={setIndustry}
                size={size}
                setSize={setSize}
                timezone={timezone}
                setTimezone={setTimezone}
                onNext={next}
              />
            )}
            {step === "team" && (
              <TeamStep
                invites={invites}
                setInvites={setInvites}
                onNext={next}
                onSkip={next}
              />
            )}
            {step === "modules" && (
              <ModulesStep
                selected={selectedModules}
                onToggle={toggleModule}
                onNext={next}
              />
            )}
            {step === "done" && (
              <DoneStep loading={loading} onFinish={handleFinish} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function WorkspaceStep({
  industry, setIndustry, size, setSize, timezone, setTimezone, onNext,
}: {
  industry: string; setIndustry: (v: string) => void
  size: string; setSize: (v: string) => void
  timezone: string; setTimezone: (v: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Set up your workspace</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tell us a bit about your business so we can tailor BackOfficeOS for you.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-muted-foreground" />
            Industry
          </Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger>
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((ind) => (
                <SelectItem key={ind} value={ind}>{ind}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Users2 className="size-3.5 text-muted-foreground" />
            Team size
          </Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue placeholder="How many people on your team?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solo">Just me</SelectItem>
              <SelectItem value="2-5">2–5 people</SelectItem>
              <SelectItem value="6-15">6–15 people</SelectItem>
              <SelectItem value="16-50">16–50 people</SelectItem>
              <SelectItem value="50+">50+ people</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground" />
            Timezone
          </Label>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button className="w-full gap-2" onClick={onNext}>
        Continue
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

function TeamStep({
  invites, setInvites, onNext, onSkip,
}: {
  invites: string[]
  setInvites: (v: string[]) => void
  onNext: () => void
  onSkip: () => void
}) {
  function updateInvite(index: number, value: string) {
    const updated = [...invites]
    updated[index] = value
    setInvites(updated)
  }

  const hasInvites = invites.some((e) => e.trim() && e.includes("@"))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Invite your team</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Add teammates now — you can always invite more later.
        </p>
      </div>

      <div className="space-y-3">
        {invites.map((email, i) => (
          <div key={i} className="space-y-1.5">
            <Label className="flex items-center gap-1.5">
              <Mail className="size-3.5 text-muted-foreground" />
              {i === 0 ? "First teammate" : "Second teammate"}
            </Label>
            <Input
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => updateInvite(i, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={onSkip}>
          Skip for now
        </Button>
        <Button className="flex-1 gap-2" onClick={onNext}>
          {hasInvites ? "Send invites" : "Continue"}
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function ModulesStep({
  selected, onToggle, onNext,
}: {
  selected: string[]
  onToggle: (id: string) => void
  onNext: () => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Choose your modules</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select the tools you&apos;ll use. You can enable more anytime.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {MODULE_OPTIONS.map((mod) => {
          const active = selected.includes(mod.id)
          return (
            <button
              key={mod.id}
              onClick={() => onToggle(mod.id)}
              className={cn(
                "relative text-left rounded-xl border p-3.5 transition-all",
                active
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-muted-foreground/40 hover:bg-muted/30"
              )}
            >
              {active && (
                <CheckCircle2 className="absolute top-2.5 right-2.5 size-3.5 text-primary" />
              )}
              <mod.icon className={cn("size-5 mb-2", active ? "text-primary" : "text-muted-foreground")} />
              <p className={cn("text-xs font-semibold leading-tight", active ? "text-foreground" : "text-foreground")}>
                {mod.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{mod.desc}</p>
            </button>
          )
        })}
      </div>

      <Button className="w-full gap-2" onClick={onNext} disabled={selected.length === 0}>
        Set up workspace
        <ArrowRight className="size-4" />
      </Button>
    </div>
  )
}

function DoneStep({ loading, onFinish }: { loading: boolean; onFinish: () => void }) {
  return (
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">You&apos;re all set!</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          Your workspace is ready. Start by creating your first client or invoice.
        </p>
      </div>

      <div className="flex flex-col gap-2 text-sm text-muted-foreground">
        {[
          "Multi-tenant workspace created",
          "AI assistant ready",
          "All modules activated",
        ].map((item) => (
          <div key={item} className="flex items-center justify-center gap-2">
            <CheckCircle2 className="size-3.5 text-green-500" />
            <span>{item}</span>
          </div>
        ))}
      </div>

      <Button className="w-full gap-2" size="lg" loading={loading} onClick={onFinish}>
        <Zap className="size-4" />
        Launch BackOfficeOS
      </Button>
    </div>
  )
}
