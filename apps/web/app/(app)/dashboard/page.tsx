import type { Metadata } from "next";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users2,
  Folders,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

const STATS = [
  {
    label: "Revenue (MTD)",
    value: formatCurrency(48250),
    change: "+12.5%",
    trend: "up" as const,
    icon: DollarSign,
    sub: "vs last month",
  },
  {
    label: "Active Clients",
    value: "64",
    change: "+3",
    trend: "up" as const,
    icon: Users2,
    sub: "2 new this week",
  },
  {
    label: "Open Projects",
    value: "18",
    change: "-2",
    trend: "down" as const,
    icon: Folders,
    sub: "4 due this week",
  },
  {
    label: "Hours Tracked",
    value: "342h",
    change: "+8.2%",
    trend: "up" as const,
    icon: Clock,
    sub: "86h billable",
  },
];

const RECENT_ACTIVITY = [
  { action: "Invoice #1042 paid", sub: "Greenfield Design — $3,200", time: "2m ago", type: "success" },
  { action: "New lead: TechFlow Inc", sub: "Inbound — Website form", time: "18m ago", type: "info" },
  { action: "Contract signed", sub: "Meridian Studio — Phase 2", time: "1h ago", type: "success" },
  { action: "Invoice #1039 overdue", sub: "BlueSky Media — $1,800 — 14 days", time: "2h ago", type: "warning" },
  { action: "Project completed", sub: "Northstar App — v1.0 launch", time: "3h ago", type: "success" },
];

const PROJECTS = [
  { name: "Northstar App Redesign", client: "Northstar Inc", progress: 78, status: "on-track", due: "Mar 28" },
  { name: "Q1 Marketing Campaign", client: "BlueSky Media",  progress: 45, status: "at-risk",  due: "Apr 2"  },
  { name: "API Integration",        client: "TechFlow",      progress: 92, status: "on-track", due: "Mar 25" },
  { name: "Brand Identity",         client: "Meridian",      progress: 30, status: "on-track", due: "Apr 15" },
];

const UPCOMING = [
  { title: "Discovery call — TechFlow", time: "10:00 AM", tag: "Call" },
  { title: "Invoice review",            time: "1:00 PM",  tag: "Internal" },
  { title: "Design review — Northstar", time: "3:30 PM",  tag: "Review" },
];

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="Dashboard"
        actions={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Calendar className="size-3.5" />
            Mar 2026
          </Button>
        }
      />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-7xl space-y-6">

          {/* Greeting */}
          <div>
            <h2 className="text-xl font-semibold">Good morning, Jane</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              You have 3 invoices due this week and 2 upcoming meetings today.
            </p>
          </div>

          {/* KPI row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
                    </div>
                    <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
                      <stat.icon className="size-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5">
                    {stat.trend === "up" ? (
                      <TrendingUp className="size-3.5 text-success" />
                    ) : (
                      <TrendingDown className="size-3.5 text-destructive" />
                    )}
                    <span
                      className={
                        stat.trend === "up"
                          ? "text-xs font-medium text-success"
                          : "text-xs font-medium text-destructive"
                      }
                    >
                      {stat.change}
                    </span>
                    <span className="text-xs text-muted-foreground">{stat.sub}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid gap-6 lg:grid-cols-3">

            {/* Projects — spans 2 cols */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-sm font-semibold">Active Projects</CardTitle>
                  <CardDescription>18 projects in progress</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs">
                  View all <ArrowUpRight className="size-3" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {PROJECTS.map((project) => (
                  <div key={project.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <Badge
                          variant={project.status === "on-track" ? "success" : "warning"}
                          dot
                        >
                          {project.status === "on-track" ? "On track" : "At risk"}
                        </Badge>
                        <span className="text-xs text-muted-foreground w-12 text-right">
                          Due {project.due}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={project.progress}
                        variant={project.status === "at-risk" ? "warning" : "default"}
                        className="h-1.5"
                      />
                      <span className="text-xs text-muted-foreground w-8 text-right">
                        {project.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's schedule */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Today</CardTitle>
                <CardDescription>Monday, March 23</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {UPCOMING.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Calendar className="size-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">{item.tag}</Badge>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-2 text-xs">
                  View calendar
                </Button>
              </CardContent>
            </Card>

          </div>

          {/* Activity feed */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
              <Button variant="ghost" size="icon-sm">
                <MoreHorizontal className="size-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {RECENT_ACTIVITY.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {item.type === "success" && (
                        <CheckCircle2 className="size-4 text-success" />
                      )}
                      {item.type === "warning" && (
                        <AlertCircle className="size-4 text-warning" />
                      )}
                      {item.type === "info" && (
                        <div className="size-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-blue-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.sub}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </main>
    </>
  );
}
