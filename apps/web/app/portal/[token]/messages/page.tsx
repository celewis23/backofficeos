import { notFound } from "next/navigation"
import { db } from "@backoffice-os/database"
import { formatDate } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { PortalMessageForm } from "./message-form"

export default async function PortalMessagesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const portalToken = await db.clientPortalToken.findUnique({
    where: { token },
    select: { clientId: true, expiresAt: true, client: { select: { organizationId: true } } },
  })

  if (!portalToken || portalToken.expiresAt < new Date()) notFound()

  const threads = await db.thread.findMany({
    where: {
      clientId: portalToken.clientId,
      organizationId: portalToken.client.organizationId,
      type: "INTERNAL",
    },
    include: {
      messages: {
        orderBy: { sentAt: "asc" },
        select: { id: true, body: true, sentAt: true, from: true, sender: { select: { name: true } } },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Messages</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Communication with your team</p>
      </div>

      <PortalMessageForm token={token} />

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl">
          <MessageSquare className="size-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium">No messages yet</p>
          <p className="text-xs text-muted-foreground mt-1">Your team will reach out to you here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.map((thread) => (
            <div key={thread.id} className="border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-border bg-muted/20">
                <p className="text-sm font-semibold">{thread.subject ?? "Message"}</p>
              </div>
              <div className="divide-y divide-border">
                {thread.messages.map((msg) => (
                  <div key={msg.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">
                        {msg.sender?.name ?? msg.from ?? "Team"}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(msg.sentAt)}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
