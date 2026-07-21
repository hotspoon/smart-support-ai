import "dotenv/config"
import pg from "pg"

const { Pool } = pg
const connectionString = process.env.DATABASE_URL
const workspaceSlug = process.env.DEFAULT_WORKSPACE_SLUG || "halo-shop"

if (!connectionString) {
  console.error("DATABASE_URL belum diisi di .env")
  process.exitCode = 1
} else {
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
  })
  try {
    await pool.query("SELECT 1")
    const workspace = await pool.query(
      `SELECT w.id,
        EXISTS (SELECT 1 FROM "PromptSetting" p WHERE p."workspaceId" = w.id) AS "hasPrompt",
        (SELECT COUNT(*)::int FROM "KnowledgeBase" k WHERE k."workspaceId" = w.id AND k."isActive" = true) AS "knowledgeCount",
        (SELECT COUNT(*)::int FROM "User" u WHERE u."workspaceId" = w.id AND u.role = 'ADMIN') AS "adminCount"
      FROM "Workspace" w
      WHERE w.slug = $1
      LIMIT 1`,
      [workspaceSlug]
    )

    console.log("Database connection OK")
    if (!workspace.rows[0]) {
      console.log(`Workspace '${workspaceSlug}' MISSING`)
      process.exitCode = 1
    } else {
      const status = workspace.rows[0]
      console.log(`Workspace '${workspaceSlug}' OK`)
      console.log(`Prompt settings: ${status.hasPrompt ? "OK" : "MISSING"}`)
      console.log(`Active knowledge articles: ${status.knowledgeCount}`)
      console.log(`Admin users: ${status.adminCount}`)
      if (
        !status.hasPrompt ||
        status.knowledgeCount === 0 ||
        status.adminCount === 0
      ) {
        process.exitCode = 2
      }
    }
  } catch (error) {
    console.error(
      `Database check failed: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}
