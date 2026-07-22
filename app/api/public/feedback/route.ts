import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError } from "@/lib/server/api"
import { requirePublicConversation } from "@/lib/server/public-chat"

const schema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(1000).optional() }).strict()

export async function POST(request: Request) {
  try {
    const conversation = await requirePublicConversation()
    if (conversation.status !== "RESOLVED") throw new ApiError(409, "CSAT tersedia setelah percakapan selesai")
    const input = schema.parse(await request.json())
    const existing = await getDb().conversationFeedback.findUnique({ where: { conversationId: conversation.id } })
    if (existing) throw new ApiError(409, "Penilaian sudah dikirim")
    const data = await getDb().conversationFeedback.create({ data: { conversationId: conversation.id, ...input } })
    return Response.json({ data }, { status: 201 })
  } catch (error) { return apiError(error) }
}
