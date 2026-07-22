import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"
import { getAIConfig } from "@/services/ai/customer-support"

const settingSchema = z
  .object({
    systemPrompt: z.string().min(20).max(10_000),
    temperature: z.number().min(0).max(2),
    autoReply: z.boolean(),
    maxHistory: z.number().int().min(1).max(50).default(10),
  })
  .strict()

export async function GET() {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const data = await getDb().promptSetting.findFirst({
      where: { workspaceId },
      select: {
        systemPrompt: true,
        temperature: true,
        autoReply: true,
        maxHistory: true,
        updatedAt: true,
      },
    })
    const ai = getAIConfig()
    return Response.json({
      data,
      runtime: { provider: ai.provider, model: ai.model },
    })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = settingSchema.parse(await request.json())
    const ai = getAIConfig()
    const data = await getDb().promptSetting.upsert({
      where: { workspaceId },
      create: {
        ...input,
        workspaceId,
        model: ai.model ?? "llama-3.3-70b-versatile",
      },
      update: input,
      select: {
        systemPrompt: true,
        temperature: true,
        autoReply: true,
        maxHistory: true,
        updatedAt: true,
      },
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}
