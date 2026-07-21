import { getDb } from "@/lib/db"
import { generateCustomerSupportReply } from "@/services/ai/customer-support"

export async function processAIReply(conversationId: string) {
  const db = getDb()
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      workspace: {
        include: {
          promptSetting: true,
          knowledgeBase: {
            where: { isActive: true },
            take: 40,
            orderBy: { updatedAt: "desc" },
          },
        },
      },
    },
  })
  if (!conversation) return { status: "failed" as const }
  const settings = conversation.workspace.promptSetting
  if (!settings || !settings.autoReply) return { status: "pending" as const }

  const recentMessages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: Math.max(1, settings.maxHistory),
  })
  const history = recentMessages.reverse()
  const currentQuestion = history.at(-1)
  if (!currentQuestion || currentQuestion.sender !== "USER") {
    return { status: "pending" as const }
  }

  try {
    const startedAt = Date.now()
    const result = await generateCustomerSupportReply({
      systemPrompt: settings.systemPrompt,
      knowledge: conversation.workspace.knowledgeBase,
      history: history
        .slice(0, -1)
        .map(({ sender, content }) => ({ sender, content })),
      question: currentQuestion.content,
      model: settings.model,
      temperature: settings.temperature,
    })
    const answer = await db.message.create({
      data: {
        conversationId,
        sender: "AI",
        content: result.content,
        model: result.model,
        latencyMs: Date.now() - startedAt,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
      },
    })
    await db.conversation.update({
      where: { id: conversationId },
      data: { status: "WAITING", lastMessageAt: answer.createdAt },
    })
    return { status: "answered" as const, answer }
  } catch {
    await db.conversation.update({
      where: { id: conversationId },
      data: { status: "OPEN" },
    })
    return { status: "failed" as const }
  }
}
