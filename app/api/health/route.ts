import { getAIConfig } from "@/services/ai/customer-support"

export function GET() {
  const ai = getAIConfig()
  return Response.json({
    ok: true,
    services: {
      database: Boolean(process.env.DATABASE_URL),
      ai: ai.configured,
    },
    ai: { provider: ai.provider, model: ai.model ?? null },
  })
}
