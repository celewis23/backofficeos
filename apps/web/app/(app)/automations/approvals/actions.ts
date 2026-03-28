"use server"

import { revalidatePath } from "next/cache"
import { requireOrg } from "@/lib/auth-server"
import { db } from "@backoffice-os/database"
import { resumeApprovalStep } from "@/lib/automation-engine"

export async function approveAutomationStep(approvalId: string) {
  try {
    const { orgId, session } = await requireOrg()

    const approval = await db.automationApproval.findFirst({
      where: { id: approvalId, organizationId: orgId, status: "PENDING" },
    })
    if (!approval) return { error: "Approval not found or already resolved" }

    await db.automationApproval.update({
      where: { id: approvalId },
      data: { status: "APPROVED", approvedBy: session.user.id, approvedAt: new Date() },
    })

    await resumeApprovalStep(approvalId)

    revalidatePath("/automations/approvals")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to approve" }
  }
}

export async function rejectAutomationStep(approvalId: string) {
  try {
    const { orgId, session } = await requireOrg()

    const approval = await db.automationApproval.findFirst({
      where: { id: approvalId, organizationId: orgId, status: "PENDING" },
      include: { run: { select: { id: true } } },
    })
    if (!approval) return { error: "Approval not found or already resolved" }

    await db.automationApproval.update({
      where: { id: approvalId },
      data: { status: "REJECTED", approvedBy: session.user.id, approvedAt: new Date() },
    })

    // Mark the paused step and the whole run as failed
    await db.automationRunStep.updateMany({
      where: { runId: approval.runId, nodeId: approval.nodeId, status: "AWAITING_APPROVAL" },
      data: { status: "FAILED", error: "Rejected by user" },
    })
    await db.automationRun.update({
      where: { id: approval.runId },
      data: { status: "FAILURE", completedAt: new Date() },
    })

    revalidatePath("/automations/approvals")
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to reject" }
  }
}
