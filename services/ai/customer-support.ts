import OpenAI from "openai"

type PromptInput = {
  systemPrompt: string
  knowledge: Array<{ title: string; content: string }>
  history: Array<{ sender: string; content: string }>
  question: string
  model?: string
  temperature?: number
}

const providerDefaults = {
  openai: { baseURL: undefined, model: "gpt-4.1-mini" },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
  },
  deepseek: {
    baseURL: "https://api.deepseek.com",
    model: "deepseek-v4-flash",
  },
  ollama: { baseURL: "http://localhost:11434/v1", model: "llama3.1:8b" },
} as const

export type AIProvider = keyof typeof providerDefaults | "custom"

export function getAIConfig() {
  const provider = (process.env.AI_PROVIDER?.toLowerCase() ||
    "openai") as AIProvider
  const defaults =
    provider in providerDefaults
      ? providerDefaults[provider as keyof typeof providerDefaults]
      : undefined
  const apiKey =
    process.env.AI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    (provider === "ollama" ? "ollama" : undefined)

  return {
    provider,
    apiKey,
    baseURL: process.env.AI_BASE_URL || defaults?.baseURL,
    model: process.env.AI_MODEL || process.env.OPENAI_MODEL || defaults?.model,
    configured: Boolean(apiKey && (process.env.AI_MODEL || defaults?.model)),
  }
}

export async function generateCustomerSupportReply(input: PromptInput) {
  const config = getAIConfig()
  const model = config.model || input.model
  if (!config.apiKey || !model) {
    throw new Error(
      "AI belum dikonfigurasi. Periksa AI_PROVIDER, AI_API_KEY, AI_BASE_URL, dan AI_MODEL."
    )
  }

  const requestTimeout = process.env.INTEGRATION_TEST === "true" ? 250 : 15_000
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    timeout: requestTimeout,
    maxRetries: 1,
  })
  const knowledge = input.knowledge
    .map((item, index) => `${index + 1}. ${item.title}\n${item.content}`)
    .join("\n\n")
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `${input.systemPrompt}\n\nKNOWLEDGE BASE\n${knowledge || "Belum ada knowledge base."}\n\nATURAN TAMBAHAN\nJawab dalam Bahasa Indonesia. Jangan mengarang informasi di luar knowledge base. Jika informasi tidak cukup, katakan dengan jujur dan tawarkan eskalasi ke admin.`,
    },
    ...input.history.map(
      (item): OpenAI.Chat.Completions.ChatCompletionMessageParam => ({
        role: item.sender === "USER" ? "user" : "assistant",
        content: item.content,
      })
    ),
    { role: "user", content: input.question },
  ]

  const response = await client.chat.completions.create(
    {
      // Environment wins so a stale DB model cannot be sent to another provider.
      model,
      temperature: input.temperature ?? 0.3,
      messages,
    },
    {
      // Keep database fallback work safely inside the route's 30 second budget.
      signal: AbortSignal.timeout(Math.min(requestTimeout * 2 + 2_000, 25_000)),
    }
  )
  const content = response.choices[0]?.message.content?.trim()
  if (!content) throw new Error("Provider AI tidak mengembalikan jawaban")

  return {
    content,
    model: response.model || model,
    provider: config.provider,
    inputTokens: response.usage?.prompt_tokens,
    outputTokens: response.usage?.completion_tokens,
  }
}
