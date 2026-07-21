import { z } from "zod"

import { getDb } from "@/lib/db"
import { generateCustomerSupportReply } from "@/services/ai/customer-support"

const chatSchema = z.object({
  conversationId: z.string().min(1),
  message: z.string().trim().min(1).max(5_000),
})

export async function POST(request: Request) {
  const startedAt = Date.now()
  try {
    const input = chatSchema.parse(await request.json())
    const db = getDb()
    const conversation = await db.conversation.findUnique({
      where: { id: input.conversationId },
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
        messages: { take: 10, orderBy: { createdAt: "desc" } },
      },
    })
    if (!conversation)
      return Response.json(
        { error: "Percakapan tidak ditemukan" },
        { status: 404 }
      )

    const settings = conversation.workspace.promptSetting
    if (!settings)
      return Response.json(
        { error: "Prompt settings belum dikonfigurasi" },
        { status: 409 }
      )

    const result = await generateCustomerSupportReply({
      systemPrompt: settings.systemPrompt,
      knowledge: conversation.workspace.knowledgeBase,
      history: conversation.messages
        .reverse()
        .map(({ sender, content }) => ({ sender, content })),
      question: input.message,
      model: settings.model,
      temperature: settings.temperature,
    })

    const [, answer] = await db.$transaction([
      db.message.create({
        data: {
          conversationId: input.conversationId,
          sender: "USER",
          content: input.message,
        },
      }),
      db.message.create({
        data: {
          conversationId: input.conversationId,
          sender: "AI",
          content: result.content,
          model: result.model,
          latencyMs: Date.now() - startedAt,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
        },
      }),
      db.conversation.update({
        where: { id: input.conversationId },
        data: { status: "WAITING" },
      }),
    ])
    return Response.json({ data: answer })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "AI gagal menjawab" },
      { status: 400 }
    )
  }
}
