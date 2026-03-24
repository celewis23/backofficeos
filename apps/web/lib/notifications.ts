import { db } from "@backoffice-os/database"

type NotificationType =
  | "INVOICE_OVERDUE"
  | "INVOICE_PAID"
  | "INVOICE_VIEWED"
  | "CONTRACT_SIGNED"
  | "CONTRACT_DECLINED"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "TASK_ASSIGNED"
  | "TASK_DUE_SOON"
  | "LEAD_ASSIGNED"
  | "MENTION"
  | "TEAM_INVITE_ACCEPTED"

interface CreateNotificationInput {
  organizationId: string
  /** If not provided, notifies all org members (admins) */
  userId?: string
  type: NotificationType
  title: string
  body: string
  entityType?: string
  entityId?: string
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    if (input.userId) {
      await db.notification.create({
        data: {
          organizationId: input.organizationId,
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
        },
      })
    } else {
      // Notify all admins/owners in the org
      const members = await db.member.findMany({
        where: { organizationId: input.organizationId, role: { in: ["owner", "admin"] } },
        select: { userId: true },
      })
      await db.notification.createMany({
        data: members.map((m) => ({
          organizationId: input.organizationId,
          userId: m.userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityType: input.entityType ?? null,
          entityId: input.entityId ?? null,
        })),
      })
    }
  } catch {
    // notifications are non-critical - never throw
  }
}
