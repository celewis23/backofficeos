import { NextRequest, NextResponse } from "next/server"
import { db } from "@backoffice-os/database"
import { resumeDelayedStep } from "@/lib/automation-engine"

/**
 * GET /api/automations/run-delayed
 *
 * Processes delayed AutomationRunStep records whose executeAt has passed.
 * Designed to be called by Vercel Cron (every minute or as needed).
 *
 * Secured with CRON_SECRET environment variable.
 */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "")
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Find all pending delayed steps that are due
    const dueSteps = await db.automationRunStep.findMany({
      where: {
        status: "PENDING",
        executeAt: { lte: new Date() },
      },
      select: { id: true },
      take: 50, // Process up to 50 per run to avoid timeouts
    })

    const results: { id: string; ok: boolean; error?: string }[] = []

    for (const step of dueSteps) {
      try {
        await resumeDelayedStep(step.id)
        results.push({ id: step.id, ok: true })
      } catch (err) {
        results.push({ id: step.id, ok: false, error: err instanceof Error ? err.message : "Unknown error" })
        // Mark step as failed so it doesn't loop
        await db.automationRunStep.updateMany({
          where: { id: step.id, status: "PENDING" },
          data: { status: "FAILED", error: "Resume failed" },
        })
      }
    }

    return NextResponse.json({ processed: results.length, results })
  } catch (e) {
    console.error("run-delayed error:", e)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
