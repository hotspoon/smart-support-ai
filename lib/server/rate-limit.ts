import { createHash } from "node:crypto"

import { getDb } from "@/lib/db"
import { ApiError } from "@/lib/server/api"

export async function enforceRateLimit(input: {
  scope: string
  identity: string
  limit: number
  windowSeconds: number
}) {
  const now = Date.now()
  const windowMs = input.windowSeconds * 1000
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs)
  const expiresAt = new Date(windowStart.getTime() + windowMs * 2)
  const key = createHash("sha256")
    .update(`${input.scope}:${input.identity}`)
    .digest("hex")
  const bucket = await getDb().rateLimitBucket.upsert({
    where: { key_windowStart: { key, windowStart } },
    create: { key, windowStart, expiresAt },
    update: { count: { increment: 1 }, expiresAt },
  })

  if (bucket.count > input.limit) {
    const retryAfter = Math.max(
      1,
      Math.ceil((windowStart.getTime() + windowMs - now) / 1000)
    )
    throw new ApiError(429, "Terlalu banyak permintaan. Coba lagi sebentar.", {
      "Retry-After": String(retryAfter),
    })
  }

  if (Math.random() < 0.02) {
    void getDb().rateLimitBucket.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
  }
}
