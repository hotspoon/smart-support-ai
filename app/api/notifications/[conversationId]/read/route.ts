import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

export async function POST(_request: Request, context: RouteContext<"/api/notifications/[conversationId]/read">) {
  try {
    const { user, workspaceId } = await requireSession()
    const { conversationId } = await context.params
    await getDb().notification.updateMany({ where: { recipientId: user.id, workspaceId, conversationId }, data: { readAt: new Date() } })
    return new Response(null, { status: 204 })
  } catch (error) { return apiError(error) }
}
