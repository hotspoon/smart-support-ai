import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError, isPrismaUniqueError } from "@/lib/server/api"
import {
  createPublicToken,
  requestFingerprint,
  requirePublicConversation,
  setPublicTokenCookie,
} from "@/lib/server/public-chat"
import { enforceRateLimit } from "@/lib/server/rate-limit"
import { processAIReply } from "@/services/chat/process-ai"

const sendSchema = z.object({
  message: z.string().trim().min(1).max(5_000),
  clientMessageId: z.string().uuid(),
})

export async function GET(request: Request) {
  try {
    const conversation = await requirePublicConversation()
    const cursor = new URL(request.url).searchParams.get("cursor")
    if (cursor) {
      const owned = await getDb().message.findFirst({
        where: { id: cursor, conversationId: conversation.id },
      })
      if (!owned) throw new ApiError(400, "Cursor tidak valid")
    }
    const data = await getDb().message.findMany({
      where: { conversationId: conversation.id },
      select: { id: true, sender: true, content: true, createdAt: true },
      orderBy: { createdAt: "asc" },
      take: 100,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    return Response.json({
      data,
      conversation: {
        id: conversation.id,
        status: conversation.status,
        customerName: conversation.customerName,
      },
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    let conversation = await requirePublicConversation()
    const input = sendSchema.parse(await request.json())
    const fingerprint = requestFingerprint(request)
    await enforceRateLimit({
      scope: "chat:send:ip",
      identity: fingerprint,
      limit: 20,
      windowSeconds: 3600,
    })
    await enforceRateLimit({
      scope: "chat:send:conversation",
      identity: conversation.id,
      limit: 10,
      windowSeconds: 60,
    })

    if (conversation.status === "RESOLVED") {
      const { token, hash } = createPublicToken()
      conversation = await getDb().conversation.create({
        data: {
          workspaceId: conversation.workspaceId,
          customerName: conversation.customerName,
          customerEmail: conversation.customerEmail,
          subject: input.message.slice(0, 120),
          channel: "WEB",
          status: "OPEN",
          tags: [],
          publicTokenHash: hash,
        },
      })
      await setPublicTokenCookie(token)
    }

    const existing = await getDb().message.findFirst({
      where: {
        conversationId: conversation.id,
        clientMessageId: input.clientMessageId,
      },
    })
    if (existing) return Response.json({ data: existing, duplicate: true })

    let message
    try {
      message = await getDb().message.create({
        data: {
          conversationId: conversation.id,
          sender: "USER",
          content: input.message,
          clientMessageId: input.clientMessageId,
        },
      })
    } catch (error) {
      if (isPrismaUniqueError(error)) {
        const duplicate = await getDb().message.findUnique({
          where: {
            conversationId_clientMessageId: {
              conversationId: conversation.id,
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
      where: { id: conversation.id },
      data: { status: "OPEN", lastMessageAt: message.createdAt },
    })
    const ai = await processAIReply(conversation.id)
    return Response.json({
      data: message,
      conversationId: conversation.id,
      status: ai.status,
    })
  } catch (error) {
    return apiError(error)
  }
}
