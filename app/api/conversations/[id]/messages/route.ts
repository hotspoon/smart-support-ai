import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError, isPrismaUniqueError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const sendSchema = z.object({
  content: z.string().trim().min(1).max(5_000),
  clientMessageId: z.string().uuid(),
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
    const cursor = new URL(request.url).searchParams.get("cursor")
    if (cursor) {
      const owned = await getDb().message.findFirst({
        where: { id: cursor, conversationId: id },
      })
      if (!owned) throw new ApiError(400, "Cursor tidak valid")
    }
    const data = await getDb().message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/conversations/[id]/messages">
) {
  try {
    const { workspaceId } = await requireSession()
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
      data: { status: "WAITING", lastMessageAt: data.createdAt },
    })
    return Response.json({ data }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}
