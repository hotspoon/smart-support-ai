import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError, isPrismaUniqueError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const sendSchema = z.object({
  content: z.string().trim().min(1).max(5_000),
  clientMessageId: z.string().uuid(),
})

const paginationSchema = z.object({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

async function ownedConversation(id: string, workspaceId: string) {
  const value = await getDb().conversation.findFirst({
    where: { id, workspaceId },
  })
  if (!value) throw new ApiError(404, "Percakapan tidak ditemukan")
  return value
}

export async function GET(
  request: Request,
  context: RouteContext<"/api/conversations/[id]/messages">
) {
  try {
    const { workspaceId } = await requireSession()
    const { id } = await context.params
    await ownedConversation(id, workspaceId)
    const searchParams = new URL(request.url).searchParams
    const { cursor, limit } = paginationSchema.parse({
      cursor: searchParams.get("cursor") || undefined,
      limit: searchParams.get("limit") || undefined,
    })
    if (cursor) {
      const owned = await getDb().message.findFirst({
        where: { id: cursor, conversationId: id },
      })
      if (!owned) throw new ApiError(400, "Cursor tidak valid")
    }
    const rows = await getDb().message.findMany({
      where: { conversationId: id },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    const hasMore = rows.length > limit
    const data = rows.slice(0, limit).reverse()
    return Response.json({
      data,
      nextCursor: hasMore ? data[0]?.id : null,
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/conversations/[id]/messages">
) {
  try {
    const { workspaceId, user } = await requireSession()
    const { id } = await context.params
    await ownedConversation(id, workspaceId)
    const input = sendSchema.parse(await request.json())
    const existing = await getDb().message.findFirst({
      where: { conversationId: id, clientMessageId: input.clientMessageId },
    })
    if (existing) return Response.json({ data: existing, duplicate: true })
    let data
    try {
      data = await getDb().message.create({
        data: {
          conversationId: id,
          sender: "ADMIN",
          content: input.content,
          clientMessageId: input.clientMessageId,
        },
      })
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        const duplicate = await getDb().message.findUnique({
          where: {
            conversationId_clientMessageId: {
              conversationId: id,
              clientMessageId: input.clientMessageId,
            },
          },
        })
        if (duplicate)
          return Response.json({ data: duplicate, duplicate: true })
      }
      throw error
    }
    await getDb().conversation.update({
      where: { id },
      data: { status: "WAITING", lastMessageAt: data.createdAt, lastAgentReplyAt: data.createdAt },
    })
    await getDb().notification.updateMany({
      where: { recipientId: user.id, conversationId: id, workspaceId },
      data: { readAt: new Date() },
    })
    return Response.json({ data }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
