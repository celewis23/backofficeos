import { db } from "@backoffice-os/database"

interface CreateAuditLogInput {
  organizationId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  ipAddress?: string | null
}

export async function createAuditLog(input: CreateAuditLogInput) {
  try {
    await db.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        ipAddress: input.ipAddress ?? null,
      },
    })
  } catch {
    // audit logs are non-critical - never throw
  }
}
