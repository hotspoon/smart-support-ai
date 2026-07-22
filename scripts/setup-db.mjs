import "dotenv/config"
import { randomUUID } from "node:crypto"
import pg from "pg"

const { Pool } = pg
const connectionString = process.env.DATABASE_URL
const workspaceSlug = process.env.DEFAULT_WORKSPACE_SLUG || "halo-shop"
const model = process.env.AI_MODEL || "llama-3.3-70b-versatile"

const articles = []

if (!connectionString) {
  console.error("DATABASE_URL belum diisi di .env")
  process.exitCode = 1
} else {
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
  })
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const workspaceResult = await client.query(
      `SELECT id FROM "Workspace" WHERE slug = $1 LIMIT 1`,
      [workspaceSlug]
    )
    const workspaceId = workspaceResult.rows[0]?.id
    if (!workspaceId)
      throw new Error(`Workspace '${workspaceSlug}' belum dibuat`)

    await client.query(
      `INSERT INTO "PromptSetting"
        (id, "workspaceId", "systemPrompt", temperature, model, "autoReply", "maxHistory", "fallbackToAgent", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 0.3, $4, true, 10, true, NOW(), NOW())
       ON CONFLICT ("workspaceId") DO UPDATE SET
         model = EXCLUDED.model,
         "updatedAt" = NOW()`,
      [
        randomUUID(),
        workspaceId,
        "Kamu adalah customer support SahutAja yang ramah, ringkas, dan akurat. Jawab hanya berdasarkan knowledge base yang tersedia. Jika informasi tidak cukup atau pelanggan meminta tindakan pada akun, katakan dengan jujur dan eskalasikan kepada admin. Gunakan Bahasa Indonesia yang natural.",
        model,
      ]
    )

    let inserted = 0
    for (const article of articles) {
      const result = await client.query(
        `INSERT INTO "KnowledgeBase"
          (id, "workspaceId", title, content, category, "isActive", "createdAt", "updatedAt")
         SELECT $1, $2, $3, $4, $5, true, NOW(), NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM "KnowledgeBase" WHERE "workspaceId" = $2 AND title = $3
         )`,
        [
          randomUUID(),
          workspaceId,
          article.title,
          article.content,
          article.category,
        ]
      )
      inserted += result.rowCount ?? 0
    }

    await client.query("COMMIT")
    console.log(
      `Database setup OK · prompt settings ready · ${inserted} articles added`
    )
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(
      `Database setup failed: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}
