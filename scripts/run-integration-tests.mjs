import "dotenv/config"

import { spawnSync } from "node:child_process"

const testUrl = process.env.TEST_DATABASE_URL
if (!testUrl) {
  console.error(
    "TEST_DATABASE_URL wajib diisi dengan Neon test branch. Test dibatalkan sebelum menyentuh database."
  )
  process.exit(1)
}

function databaseIdentity(value) {
  const url = new URL(value)
  const host = url.hostname.replace(/-pooler(?=\.)/, "")
  return `${url.protocol}//${url.username}@${host}:${url.port}${url.pathname}`
}

if (
  process.env.DATABASE_URL &&
  databaseIdentity(testUrl) === databaseIdentity(process.env.DATABASE_URL)
) {
  console.error(
    "TEST_DATABASE_URL menunjuk database yang sama dengan DATABASE_URL. Test dibatalkan."
  )
  process.exit(1)
}

const port = process.env.INTEGRATION_PORT ?? "3100"
const aiPort = process.env.INTEGRATION_AI_PORT ?? "3101"
const migrationUrl = new URL(testUrl)
migrationUrl.hostname = migrationUrl.hostname.replace(/-pooler(?=\.)/, "")
const environment = {
  ...process.env,
  DATABASE_URL: testUrl,
  NODE_ENV: "production",
  NEXT_DIST_DIR: ".next-integration",
  BETTER_AUTH_URL: `http://127.0.0.1:${port}`,
  BETTER_AUTH_SECRET: "integration-auth-secret-00000000000000000001",
  CHAT_SESSION_SECRET: "integration-chat-secret-00000000000000000002",
  AUTH_REQUIRED: "true",
  AUTH_DISABLE_SIGN_UP: "false",
  DEFAULT_WORKSPACE_SLUG: "integration-primary",
  AI_PROVIDER: "custom",
  AI_API_KEY: "integration-fake-key",
  AI_BASE_URL: `http://127.0.0.1:${aiPort}/v1`,
  AI_MODEL: "integration-model",
  INTEGRATION_TEST: "true",
  INTEGRATION_PORT: port,
  INTEGRATION_AI_PORT: aiPort,
}

function run(command, args, env = environment) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run("./node_modules/.bin/prisma", ["migrate", "deploy"], {
  ...environment,
  DATABASE_URL: migrationUrl.toString(),
})
run("./node_modules/.bin/next", ["build"])
run(process.execPath, [
  "--test",
  "--test-concurrency=1",
  "tests/integration/api.test.mjs",
])
