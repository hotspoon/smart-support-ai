import { getAIConfig } from "@/services/ai/customer-support"

export function GET() {
  const ai = getAIConfig()
  return Response.json({
    ok: true,
    services: {
      database: Boolean(process.env.DATABASE_URL),
      ai: ai.configured,
      chatSession: Boolean(
        process.env.CHAT_SESSION_SECRET || process.env.BETTER_AUTH_SECRET
      ),
    },
    ai: { provider: ai.provider, model: ai.model ?? null },
  })
}
