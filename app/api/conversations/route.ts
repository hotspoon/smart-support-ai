import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const querySchema = z.object({
  status: z.enum(["OPEN", "WAITING", "RESOLVED"]).optional(),
  query: z.string().trim().max(100).optional(),
  needsAttention: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireSession()
    const url = new URL(request.url)
    const input = querySchema.parse(Object.fromEntries(url.searchParams))
    const attentionBefore = new Date(Date.now() - 15 * 60 * 1000)
    const rows = await getDb().conversation.findMany({
      where: {
        workspaceId,
        ...(input.needsAttention === "true" ? { status: { not: "RESOLVED" } } : { status: input.status }),
        ...(input.query
          ? {
              OR: [
                {
                  customerName: { contains: input.query, mode: "insensitive" },
                },
                {
                  customerEmail: { contains: input.query, mode: "insensitive" },
                },
                { subject: { contains: input.query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        customerName: true,
        customerEmail: true,
        status: true,
        subject: true,
        tags: true,
        channel: true,
        lastMessageAt: true,
        lastCustomerMessageAt: true,
        lastAgentReplyAt: true,
        createdAt: true,
        resolvedAt: true,
        resolutionSource: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ lastCustomerMessageAt: "asc" }, { lastMessageAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    const eligible = input.needsAttention === "true"
      ? rows.filter((row) => row.lastCustomerMessageAt <= attentionBefore && (!row.lastAgentReplyAt || row.lastAgentReplyAt < row.lastCustomerMessageAt))
      : rows
    const hasMore = eligible.length > input.limit
    const data = hasMore ? eligible.slice(0, input.limit) : eligible
    return Response.json({
      data: data.map((row) => ({
        ...row,
        needsAttention: row.status !== "RESOLVED" && row.lastCustomerMessageAt <= attentionBefore && (!row.lastAgentReplyAt || row.lastAgentReplyAt < row.lastCustomerMessageAt),
      })),
      nextCursor: hasMore ? data.at(-1)?.id : null,
    })
  } catch (error) {
    return apiError(error)
  }
}
