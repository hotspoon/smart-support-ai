import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const querySchema = z.object({
  status: z.enum(["OPEN", "WAITING", "RESOLVED"]).optional(),
  query: z.string().trim().max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
})

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireSession()
    const url = new URL(request.url)
    const input = querySchema.parse(Object.fromEntries(url.searchParams))
    const rows = await getDb().conversation.findMany({
      where: {
        workspaceId,
        status: input.status,
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
        createdAt: true,
        resolvedAt: true,
        resolutionSource: true,
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        assignedTo: { select: { id: true, name: true } },
      },
      orderBy: [{ lastMessageAt: "desc" }, { id: "desc" }],
      take: input.limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    })
    const hasMore = rows.length > input.limit
    const data = hasMore ? rows.slice(0, input.limit) : rows
    return Response.json({ data, nextCursor: hasMore ? data.at(-1)?.id : null })
  } catch (error) {
    return apiError(error)
  }
}
