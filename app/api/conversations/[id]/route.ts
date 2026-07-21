import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const inputSchema = z.object({
  status: z.enum(["OPEN", "WAITING", "RESOLVED"]).optional(),
  assignedToId: z.string().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
})

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/conversations/[id]">
) {
  try {
    const { workspaceId } = await requireSession()
    const { id } = await context.params
    const input = inputSchema.parse(await request.json())
    const conversation = await getDb().conversation.findFirst({
      where: { id, workspaceId },
    })
    if (!conversation) throw new ApiError(404, "Percakapan tidak ditemukan")
    if (input.assignedToId) {
      const agent = await getDb().user.findFirst({
        where: { id: input.assignedToId, workspaceId },
      })
      if (!agent) throw new ApiError(400, "Agent tidak valid")
    }
    let resolutionSource = input.status ? null : conversation.resolutionSource
    if (input.status === "RESOLVED") {
      const adminMessage = await getDb().message.findFirst({
        where: { conversationId: id, sender: "ADMIN" },
        select: { id: true },
      })
      resolutionSource = adminMessage ? "ADMIN" : "AI"
    }
    const data = await getDb().conversation.update({
      where: { id },
      data: {
        ...input,
        resolutionSource,
        resolvedAt:
          input.status === "RESOLVED"
            ? new Date()
            : input.status
              ? null
              : undefined,
      },
      select: {
        id: true,
        status: true,
        assignedToId: true,
        tags: true,
        resolutionSource: true,
        resolvedAt: true,
        lastMessageAt: true,
      },
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}
