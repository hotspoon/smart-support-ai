import { getDb } from "@/lib/db"

export async function notifyWorkspaceOfCustomerMessage(input: {
  workspaceId: string
  conversationId: string
  occurredAt: Date
}) {
  const recipients = await getDb().user.findMany({
    where: { workspaceId: input.workspaceId },
    select: { id: true },
  })
  await Promise.all(
    recipients.map((recipient) =>
      getDb().notification.upsert({
        where: {
          recipientId_conversationId: {
            recipientId: recipient.id,
            conversationId: input.conversationId,
          },
        },
        create: {
          workspaceId: input.workspaceId,
          recipientId: recipient.id,
          conversationId: input.conversationId,
          lastEventAt: input.occurredAt,
        },
        update: { lastEventAt: input.occurredAt, readAt: null },
      })
    )
  )
}
