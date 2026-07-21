import "dotenv/config"
import OpenAI from "openai"

const provider = process.env.AI_PROVIDER || "openai"
const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
const baseURL = process.env.AI_BASE_URL
const model = process.env.AI_MODEL || process.env.OPENAI_MODEL

if (!apiKey || !model) {
  console.error("AI_API_KEY atau AI_MODEL belum diisi di .env")
  process.exitCode = 1
} else {
  const client = new OpenAI({ apiKey, baseURL, timeout: 30_000, maxRetries: 1 })
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: "Balas tepat dengan kata: siap" }],
      temperature: 0,
      max_tokens: 8,
    })
    console.log(
      `AI connection OK · provider=${provider} · model=${response.model}`
    )
    console.log(
      `Response: ${response.choices[0]?.message.content?.trim() || "(kosong)"}`
    )
  } catch (error) {
    console.error(
      `AI connection failed: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exitCode = 1
  }
}
