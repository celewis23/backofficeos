import { streamText, tool } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { auth } from "@backoffice-os/auth"
import { db } from "@backoffice-os/database"
import { headers } from "next/headers"
import { NextRequest } from "next/server"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  const orgId = session.session.activeOrganizationId
  if (!orgId) {
    return new Response("No active organization", { status: 400 })
  }

  const { messages, context } = await req.json()

  const systemPrompt = buildSystemPrompt(context, session.user)

  const result = streamText({
    model: anthropic("claude-opus-4-6"),
    system: systemPrompt,
    messages,
    maxSteps: 5,
    tools: {
      searchClients: tool({
        description: "Search for clients in the organization by name or email",
        parameters: z.object({
          query: z.string().describe("Search query"),
        }),
        execute: async ({ query }) => {
          const clients = await db.client.findMany({
            where: {
              organizationId: orgId,
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, name: true, email: true, status: true },
            take: 5,
          })
          return { clients }
        },
      }),

      getInvoiceSummary: tool({
        description: "Get a summary of invoices — totals, outstanding, overdue",
        parameters: z.object({
          status: z.enum(["all", "outstanding", "overdue", "paid"]).optional(),
        }),
        execute: async ({ status }) => {
          const where: any = { organizationId: orgId }
          if (status === "outstanding") where.status = { in: ["SENT", "VIEWED", "PARTIAL"] }
          else if (status === "overdue") where.status = "OVERDUE"
          else if (status === "paid") where.status = "PAID"

          const [invoices, totals] = await Promise.all([
            db.invoice.findMany({
              where,
              include: { client: { select: { name: true } } },
              orderBy: { createdAt: "desc" },
              take: 10,
            }),
            db.invoice.aggregate({
              where,
              _sum: { total: true, amountDue: true },
              _count: { id: true },
            }),
          ])

          return {
            count: totals._count.id,
            totalAmount: Number(totals._sum.total ?? 0),
            amountDue: Number(totals._sum.amountDue ?? 0),
            recentInvoices: invoices.map((inv) => ({
              number: inv.number,
              client: inv.client?.name ?? "Unknown",
              amount: Number(inv.total),
              status: inv.status,
              dueDate: inv.dueDate?.toISOString().split("T")[0],
            })),
          }
        },
      }),

      getProjectStatus: tool({
        description: "Get current project status and task completion across all projects",
        parameters: z.object({
          projectName: z.string().optional().describe("Filter by project name"),
        }),
        execute: async ({ projectName }) => {
          const projects = await db.project.findMany({
            where: {
              organizationId: orgId,
              isTemplate: false,
              ...(projectName ? { name: { contains: projectName, mode: "insensitive" } } : {}),
            },
            include: {
              _count: {
                select: {
                  tasks: true,
                },
              },
            },
            orderBy: { updatedAt: "desc" },
            take: 10,
          })

          return {
            projects: projects.map((p) => ({
              name: p.name,
              status: p.status,
              taskCount: p._count.tasks,
              dueDate: p.dueDate?.toISOString().split("T")[0],
            })),
          }
        },
      }),

      createInvoiceDraft: tool({
        description: "Create a draft invoice for a client",
        parameters: z.object({
          clientName: z.string().describe("Client name to search for"),
          amount: z.number().describe("Invoice total amount"),
          description: z.string().describe("What the invoice is for"),
          dueInDays: z.number().default(30).describe("Days until due"),
        }),
        execute: async ({ clientName, amount, description, dueInDays }) => {
          const client = await db.client.findFirst({
            where: {
              organizationId: orgId,
              name: { contains: clientName, mode: "insensitive" },
            },
          })

          if (!client) {
            return { error: `No client found matching "${clientName}"` }
          }

          const lastInvoice = await db.invoice.findFirst({
            where: { organizationId: orgId },
            orderBy: { createdAt: "desc" },
            select: { number: true },
          })

          const lastNum = lastInvoice?.number.match(/(\d+)$/)?.[1]
          const nextNum = lastNum ? String(parseInt(lastNum, 10) + 1).padStart(4, "0") : "0001"
          const number = `INV-${nextNum}`

          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + dueInDays)

          const invoice = await db.invoice.create({
            data: {
              organizationId: orgId,
              clientId: client.id,
              number,
              status: "DRAFT",
              subtotal: amount,
              total: amount,
              amountDue: amount,
              dueDate,
              items: {
                create: [{
                  description,
                  quantity: 1,
                  unitPrice: amount,
                  amount,
                  order: 0,
                }],
              },
            },
          })

          return {
            success: true,
            invoiceId: invoice.id,
            number: invoice.number,
            client: client.name,
            amount,
            message: `Draft invoice ${number} created for ${client.name} — $${amount}. Due in ${dueInDays} days.`,
          }
        },
      }),

      getUpcomingEvents: tool({
        description: "Get upcoming calendar events and appointments",
        parameters: z.object({
          days: z.number().default(7).describe("Number of days to look ahead"),
        }),
        execute: async ({ days }) => {
          const now = new Date()
          const until = new Date()
          until.setDate(until.getDate() + days)

          const events = await db.event.findMany({
            where: {
              organizationId: orgId,
              startAt: { gte: now, lte: until },
            },
            include: { client: { select: { name: true } } },
            orderBy: { startAt: "asc" },
            take: 10,
          })

          return {
            events: events.map((e) => ({
              title: e.title,
              client: e.client?.name,
              startAt: e.startAt.toISOString(),
              endAt: e.endAt.toISOString(),
              videoUrl: e.videoUrl,
            })),
          }
        },
      }),
    },
  })

  return result.toDataStreamResponse()
}

function buildSystemPrompt(context: any, user: any): string {
  const now = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let contextStr = ""
  if (context?.module) {
    contextStr += `\nThe user is currently viewing: ${context.module}`
    if (context.entityType && context.entityName) {
      contextStr += ` → ${context.entityType}: ${context.entityName}`
    }
  }

  return `You are BackOffice AI, the intelligent assistant built into ArcheionOS — a business operating system used by entrepreneurs and business teams.

Today is ${now}. The user's name is ${user?.name ?? "there"}.
${contextStr}

You are a knowledgeable business partner, not a chatbot. Your responses are:
- Concise and actionable (avoid long paragraphs)
- Business-focused and professional
- Proactive — if you notice something relevant (e.g., an overdue invoice), mention it

You have access to tools that let you:
- Search clients and contacts
- View invoice status and summaries
- Check project and task status
- Create draft invoices
- View upcoming calendar events

When taking actions (like creating an invoice), confirm clearly what you did and provide a direct link or next step.
Do not repeat information already in the conversation. Keep replies short and to the point.`
}
