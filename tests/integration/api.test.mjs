import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { randomUUID } from "node:crypto"
import http from "node:http"
import { after, before, test } from "node:test"

import pg from "pg"

const port = Number(process.env.INTEGRATION_PORT ?? 3100)
const aiPort = Number(process.env.INTEGRATION_AI_PORT ?? 3101)
const origin = `http://127.0.0.1:${port}`
const primaryWorkspaceId = `ws-${randomUUID()}`
const secondaryWorkspaceId = `ws-${randomUUID()}`
const fixtureSlugs = ["integration-primary", "integration-secondary"]
const db = new pg.Client({ connectionString: process.env.DATABASE_URL })
const delayedResponses = []
const timedOutResponses = []
let app
let fakeAI
let adminCookie
let agentCookie
let agentId
let foreignId

function json(response, status, body) {
  response.writeHead(status, { "content-type": "application/json" })
  response.end(JSON.stringify(body))
}

function completion(response) {
  json(response, 200, {
    id: `chatcmpl-${randomUUID()}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "integration-model",
    choices: [
      {
        index: 0,
        finish_reason: "stop",
        message: { role: "assistant", content: "Jawaban integration AI." },
      },
    ],
    usage: { prompt_tokens: 10, completion_tokens: 4, total_tokens: 14 },
  })
}

function startFakeAI() {
  return new Promise((resolve) => {
    fakeAI = http.createServer((request, response) => {
      let raw = ""
      request.on("data", (chunk) => (raw += chunk))
      request.on("end", () => {
        const body = JSON.parse(raw || "{}")
        const question = body.messages?.at(-1)?.content ?? ""
        if (question.includes("__AI_FAIL__")) {
          json(response, 500, { error: { message: "forced test failure" } })
          return
        }
        if (question.includes("__AI_DELAY__")) {
          delayedResponses.push(response)
          return
        }
        if (question.includes("__AI_TIMEOUT__")) {
          timedOutResponses.push(response)
          return
        }
        completion(response)
      })
    })
    fakeAI.listen(aiPort, "127.0.0.1", resolve)
  })
}

async function waitForApp() {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error("Next.js integration server tidak siap dalam 30 detik")
}

async function api(path, options = {}) {
  const response = await fetch(`${origin}${path}`, options)
  const body = await response.json().catch(() => null)
  return { response, body }
}

function cookieFrom(response) {
  const value = response.headers.get("set-cookie") ?? ""
  const match = value.match(/(?:__Secure-)?better-auth\.session_token=[^;]+/)
  assert.ok(match, `Session cookie tidak ditemukan: ${value}`)
  return match[0]
}

async function signUp(name, email) {
  const { response, body } = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, email, password: "IntegrationPass123!" }),
  })
  assert.equal(response.status, 200, JSON.stringify(body))
  return { id: body.user.id, cookie: cookieFrom(response) }
}

async function createConversation(workspaceId, values = {}) {
  const id = `conv-${randomUUID()}`
  const now = values.createdAt ?? new Date()
  await db.query(
    `insert into "Conversation"
      (id, "workspaceId", "customerName", "customerEmail", channel, status,
       subject, tags, "lastMessageAt", "createdAt", "updatedAt")
     values ($1, $2, $3, $4, 'WEB', $5::"ConversationStatus", $6,
       $7::text[], $8, $8, $8)`,
    [
      id,
      workspaceId,
      values.customerName ?? "Integration Customer",
      values.customerEmail ?? "fixture@example.com",
      values.status ?? "OPEN",
      values.subject ?? "Integration subject",
      values.tags ?? [],
      now,
    ]
  )
  return id
}

before(async () => {
  await db.connect()
  // The runner URL guard guarantees this recovery cleanup only targets the
  // dedicated test branch.
  await db.query(`delete from "Workspace" where slug = any($1::text[])`, [
    fixtureSlugs,
  ])
  await db.query(
    `insert into "Workspace" (id, name, slug, "createdAt", "updatedAt")
     values ($1, 'Integration Primary', $2, now(), now()),
            ($3, 'Integration Other', $4, now(), now())`,
    [primaryWorkspaceId, fixtureSlugs[0], secondaryWorkspaceId, fixtureSlugs[1]]
  )
  await db.query(
    `insert into "PromptSetting"
      (id, "workspaceId", "systemPrompt", temperature, model, "autoReply",
       "maxHistory", "fallbackToAgent", "createdAt", "updatedAt")
     values ($1, $2, $3, 0.2, 'integration-model', true, 10, true, now(), now())`,
    [
      `prompt-${randomUUID()}`,
      primaryWorkspaceId,
      "Kamu adalah customer support integration test yang selalu ringkas.",
    ]
  )
  await startFakeAI()
  app = spawn("./node_modules/.bin/next", ["start", "-p", String(port)], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  })
  app.stdout.on("data", (chunk) => process.stdout.write(chunk))
  app.stderr.on("data", (chunk) => process.stderr.write(chunk))
  await waitForApp()

  const admin = await signUp(
    "Integration Admin",
    `admin-${randomUUID()}@example.com`
  )
  adminCookie = admin.cookie
  const agent = await signUp(
    "Integration Agent",
    `agent-${randomUUID()}@example.com`
  )
  agentId = agent.id
  agentCookie = agent.cookie
  await db.query(`update "User" set role = 'AGENT' where id = $1`, [agentId])
  const foreign = await signUp(
    "Integration Foreign",
    `foreign-${randomUUID()}@example.com`
  )
  foreignId = foreign.id
  await db.query(`update "User" set "workspaceId" = $1 where id = $2`, [
    secondaryWorkspaceId,
    foreignId,
  ])
})

after(async () => {
  for (const response of delayedResponses.splice(0)) response.destroy()
  for (const response of timedOutResponses.splice(0)) response.destroy()
  if (app && !app.killed) {
    app.kill("SIGTERM")
    await new Promise((resolve) => app.once("exit", resolve))
  }
  if (fakeAI) await new Promise((resolve) => fakeAI.close(resolve))
  await db.query(`delete from "RateLimitBucket"`)
  await db.query(`delete from "Workspace" where id = any($1::text[])`, [
    [primaryWorkspaceId, secondaryWorkspaceId],
  ])
  await db.end()
})

test("admin API menegakkan 401, 403, dan cross-workspace 404", async () => {
  const unauthenticated = await api("/api/conversations")
  assert.equal(unauthenticated.response.status, 401)

  const forbidden = await api("/api/kb", {
    headers: { cookie: agentCookie },
  })
  assert.equal(forbidden.response.status, 403)

  const foreignConversation = await createConversation(secondaryWorkspaceId)
  const hidden = await api(
    `/api/conversations/${foreignConversation}/messages`,
    {
      headers: { cookie: adminCookie },
    }
  )
  assert.equal(hidden.response.status, 404)
})

test("public chat menolak cookie invalid", async () => {
  const result = await api("/api/public/messages", {
    headers: { cookie: "halodesk_chat=invalid" },
  })
  assert.equal(result.response.status, 401)
})

test("idempotency sequential dan concurrent tidak membuat pesan ganda", async () => {
  const started = await api("/api/public/conversations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.30",
    },
    body: JSON.stringify({
      name: "Idempotency Customer",
      email: "idempotency@example.com",
      message: "Start idempotency",
      clientMessageId: randomUUID(),
    }),
  })
  assert.equal(started.response.status, 201, JSON.stringify(started.body))
  const conversationId = started.body.data.conversationId
  const headers = {
    cookie: (started.response.headers.get("set-cookie") ?? "").split(";")[0],
    "content-type": "application/json",
    "x-forwarded-for": "198.51.100.31",
  }
  const sequentialId = randomUUID()
  const sequentialBody = JSON.stringify({
    message: "Sequential idempotency",
    clientMessageId: sequentialId,
  })
  await api("/api/public/messages", {
    method: "POST",
    headers,
    body: sequentialBody,
  })
  await api("/api/public/messages", {
    method: "POST",
    headers,
    body: sequentialBody,
  })
  const concurrentId = randomUUID()
  const concurrentBody = JSON.stringify({
    message: "Concurrent idempotency",
    clientMessageId: concurrentId,
  })
  await Promise.all([
    api("/api/public/messages", {
      method: "POST",
      headers,
      body: concurrentBody,
    }),
    api("/api/public/messages", {
      method: "POST",
      headers,
      body: concurrentBody,
    }),
  ])
  const count = await db.query(
    `select count(*)::int as count from "Message"
      where "conversationId" = $1 and "clientMessageId" = any($2::text[])`,
    [conversationId, [sequentialId, concurrentId]]
  )
  assert.equal(count.rows[0].count, 2)
})

test("pesan USER tersimpan sebelum AI dan error AI mengeskalasi ke OPEN", async () => {
  const started = await api("/api/public/conversations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify({
      name: "Public Integration",
      email: "public-integration@example.com",
      message: "Halo integration",
      clientMessageId: randomUUID(),
    }),
  })
  assert.equal(started.response.status, 201, JSON.stringify(started.body))
  const publicCookie = (started.response.headers.get("set-cookie") ?? "").split(
    ";"
  )[0]
  const conversationId = started.body.data.conversationId

  const delayedId = randomUUID()
  const pending = api("/api/public/messages", {
    method: "POST",
    headers: {
      cookie: publicCookie,
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.11",
    },
    body: JSON.stringify({
      message: "__AI_DELAY__ verify storage",
      clientMessageId: delayedId,
    }),
  })
  const deadline = Date.now() + 5_000
  while (!delayedResponses.length && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 25))
  }
  assert.ok(delayedResponses.length, "Fake AI tidak menerima delayed request")
  const stored = await db.query(
    `select sender from "Message"
      where "conversationId" = $1 and "clientMessageId" = $2`,
    [conversationId, delayedId]
  )
  assert.equal(stored.rows[0]?.sender, "USER")
  completion(delayedResponses.shift())
  const delayedResult = await pending
  assert.equal(delayedResult.body.status, "answered")

  const failed = await api("/api/public/messages", {
    method: "POST",
    headers: {
      cookie: publicCookie,
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.12",
    },
    body: JSON.stringify({
      message: "__AI_FAIL__ escalate",
      clientMessageId: randomUUID(),
    }),
  })
  assert.equal(failed.body.status, "failed")
  const state = await db.query(
    `select status from "Conversation" where id = $1`,
    [conversationId]
  )
  assert.equal(state.rows[0].status, "OPEN")

  const timedOut = await api("/api/public/messages", {
    method: "POST",
    headers: {
      cookie: publicCookie,
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.13",
    },
    body: JSON.stringify({
      message: "__AI_TIMEOUT__ escalate",
      clientMessageId: randomUUID(),
    }),
  })
  assert.equal(timedOut.body.status, "failed")
  const timeoutState = await db.query(
    `select status from "Conversation" where id = $1`,
    [conversationId]
  )
  assert.equal(timeoutState.rows[0].status, "OPEN")
})

test("rate limit menghasilkan 429 dan Retry-After", async () => {
  let last
  for (let index = 0; index < 6; index++) {
    last = await api("/api/public/conversations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.99",
      },
      body: "{}",
    })
  }
  assert.equal(last.response.status, 429)
  assert.ok(Number(last.response.headers.get("retry-after")) > 0)
})

test("pagination admin dan public membaca lebih dari 100 pesan tanpa duplikat", async () => {
  const started = await api("/api/public/conversations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "192.0.2.44",
    },
    body: JSON.stringify({
      name: "Pagination Customer",
      email: "pagination@example.com",
      message: "Pagination start",
      clientMessageId: randomUUID(),
    }),
  })
  const publicCookie = (started.response.headers.get("set-cookie") ?? "").split(
    ";"
  )[0]
  const conversationId = started.body.data.conversationId
  const values = []
  const parameters = []
  for (let index = 0; index < 121; index++) {
    const offset = parameters.length
    values.push(
      `($${offset + 1}, $${offset + 2}, 'USER', $${offset + 3}, $${offset + 4}, now())`
    )
    parameters.push(
      `page-${randomUUID()}`,
      conversationId,
      `Pagination ${index}`,
      randomUUID()
    )
  }
  await db.query(
    `insert into "Message"
      (id, "conversationId", sender, content, "clientMessageId", "createdAt")
     values ${values.join(",")}`,
    parameters
  )

  async function collect(path, headers) {
    const ids = []
    let cursor = ""
    do {
      const result = await api(
        `${path}?limit=50${cursor ? `&cursor=${cursor}` : ""}`,
        { headers }
      )
      assert.equal(result.response.status, 200, JSON.stringify(result.body))
      ids.push(...result.body.data.map((message) => message.id))
      cursor = result.body.nextCursor ?? ""
    } while (cursor)
    return ids
  }

  const adminIds = await collect(
    `/api/conversations/${conversationId}/messages`,
    { cookie: adminCookie }
  )
  const publicIds = await collect("/api/public/messages", {
    cookie: publicCookie,
  })
  assert.ok(adminIds.length > 100)
  assert.equal(new Set(adminIds).size, adminIds.length)
  assert.deepEqual(new Set(publicIds), new Set(adminIds))
})

test("assignment, tags, agents, KB, dan settings persisten", async () => {
  const conversationId = await createConversation(primaryWorkspaceId)
  const agents = await api("/api/agents", { headers: { cookie: agentCookie } })
  assert.equal(agents.response.status, 200)
  assert.ok(agents.body.data.some((agent) => agent.id === agentId))
  assert.deepEqual(Object.keys(agents.body.data[0]).sort(), [
    "id",
    "image",
    "name",
    "role",
  ])

  const updated = await api(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({
      assignedToId: agentId,
      tags: ["Refund", "refund", " Prioritas "],
    }),
  })
  assert.equal(updated.response.status, 200)
  assert.deepEqual(updated.body.data.tags, ["refund", "Prioritas"])
  assert.equal(updated.body.data.assignedTo.id, agentId)

  const foreignAssignment = await api(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ assignedToId: foreignId }),
  })
  assert.equal(foreignAssignment.response.status, 400)

  const article = await api("/api/kb", {
    method: "POST",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({
      title: "Integration persistence",
      content: "Konten integration persistence",
      category: "Testing",
    }),
  })
  assert.equal(article.response.status, 201)
  const articles = await api("/api/kb", { headers: { cookie: adminCookie } })
  assert.ok(articles.body.data.some((item) => item.id === article.body.data.id))

  const settingsPayload = {
    systemPrompt: "System prompt integration yang cukup panjang dan persisten.",
    temperature: 0.4,
    autoReply: true,
    maxHistory: 14,
  }
  const saved = await api("/api/settings", {
    method: "PATCH",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify(settingsPayload),
  })
  assert.equal(saved.response.status, 200)
  assert.equal(saved.body.data.fallbackToAgent, undefined)
  const settings = await api("/api/settings", {
    headers: { cookie: adminCookie },
  })
  assert.equal(settings.body.data.systemPrompt, settingsPayload.systemPrompt)
  assert.equal(settings.body.data.maxHistory, 14)
})

test("analytics memakai batas hari Asia/Jakarta", async () => {
  const before = await api("/api/analytics?range=7d", {
    headers: { cookie: adminCookie },
  })
  const jakartaDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())
  const startUtc = new Date(`${jakartaDate}T00:30:00+07:00`)
  const previousUtc = new Date(startUtc.getTime() - 60 * 60 * 1000)
  await createConversation(primaryWorkspaceId, {
    subject: `Jakarta today ${randomUUID()}`,
    createdAt: startUtc,
  })
  await createConversation(primaryWorkspaceId, {
    subject: `Jakarta previous ${randomUUID()}`,
    createdAt: previousUtc,
  })
  const afterResult = await api("/api/analytics?range=7d", {
    headers: { cookie: adminCookie },
  })
  assert.equal(
    afterResult.body.data.today.conversations,
    before.body.data.today.conversations + 1
  )
})
