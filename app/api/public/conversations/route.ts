import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import {
  createPublicToken,
  requestFingerprint,
  setPublicTokenCookie,
} from "@/lib/server/public-chat"
import { enforceRateLimit } from "@/lib/server/rate-limit"
import { notifyWorkspaceOfCustomerMessage } from "@/lib/server/notifications"
import { processAIReply } from "@/services/chat/process-ai"

export const maxDuration = 30

const inputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(1).max(5_000),
  clientMessageId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    await enforceRateLimit({
      scope: "chat:create",
      identity: requestFingerprint(request),
      limit: 5,
      windowSeconds: 3600,
    })
    const input = inputSchema.parse(await request.json())
    const workspace = await getDb().workspace.findUniqueOrThrow({
      where: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop" },
      select: { id: true },
    })
    const { token, hash } = createPublicToken()
    const conversation = await getDb().conversation.create({
      data: {
        workspaceId: workspace.id,
        customerName: input.name,
        customerEmail: input.email.toLowerCase(),
        subject: input.message.slice(0, 120),
        channel: "WEB",
        status: "OPEN",
        tags: [],
        publicTokenHash: hash,
        lastCustomerMessageAt: new Date(),
        messages: {
          create: {
            sender: "USER",
            content: input.message,
            clientMessageId: input.clientMessageId,
          },
        },
      },
      include: { messages: true },
    })
    await notifyWorkspaceOfCustomerMessage({ workspaceId: workspace.id, conversationId: conversation.id, occurredAt: conversation.createdAt })
    await setPublicTokenCookie(token)
    const ai = await processAIReply(conversation.id)
    return Response.json(
      { data: { conversationId: conversation.id, status: ai.status } },
      { status: 201 }
    )
  } catch (error) {
    return apiError(error)
  }
}
