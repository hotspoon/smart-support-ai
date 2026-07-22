import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

export async function GET() {
  try {
    const { user, workspaceId } = await requireSession()
    const [data, unread] = await Promise.all([
      getDb().notification.findMany({
        where: { recipientId: user.id, workspaceId }, orderBy: { lastEventAt: "desc" }, take: 20,
        select: { id: true, conversationId: true, lastEventAt: true, readAt: true, conversation: { select: { customerName: true, subject: true } } },
      }),
      getDb().notification.count({ where: { recipientId: user.id, workspaceId, readAt: null } }),
    ])
    return Response.json({ data, unread })
  } catch (error) { return apiError(error) }
}
