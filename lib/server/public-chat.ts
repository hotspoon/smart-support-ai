import { createHash, createHmac, randomBytes } from "node:crypto"
import { cookies } from "next/headers"

import { getDb } from "@/lib/db"
import { ApiError } from "@/lib/server/api"

export const PUBLIC_CHAT_COOKIE = "halodesk_chat"

function chatSecret() {
  const chat = process.env.CHAT_SESSION_SECRET
  const auth = process.env.BETTER_AUTH_SECRET

  if (!auth || auth.length < 32) {
    throw new ApiError(503, "BETTER_AUTH_SECRET minimal 32 karakter")
  }
  if (process.env.NODE_ENV === "production" && !chat) {
    throw new ApiError(503, "CHAT_SESSION_SECRET wajib di production")
  }
  if (chat && chat.length < 32) {
    throw new ApiError(503, "CHAT_SESSION_SECRET minimal 32 karakter")
  }
  if (chat && chat === auth) {
    throw new ApiError(
      503,
      "CHAT_SESSION_SECRET harus berbeda dari BETTER_AUTH_SECRET"
    )
  }

  // Development may reuse the auth secret so a fresh clone remains usable.
  return chat || auth
}

export function createPublicToken() {
  const token = randomBytes(32).toString("base64url")
  return { token, hash: hashPublicToken(token) }
}

export function hashPublicToken(token: string) {
  return createHmac("sha256", chatSecret()).update(token).digest("hex")
}

export async function setPublicTokenCookie(token: string) {
  const store = await cookies()
  store.set(PUBLIC_CHAT_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    priority: "high",
  })
}

export async function requirePublicConversation() {
  const token = (await cookies()).get(PUBLIC_CHAT_COOKIE)?.value
  if (!token) throw new ApiError(401, "Sesi chat tidak ditemukan")
  const conversation = await getDb().conversation.findUnique({
    where: { publicTokenHash: hashPublicToken(token) },
  })
  if (!conversation) throw new ApiError(401, "Sesi chat tidak valid")
  return conversation
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim()
  const ip = forwarded || request.headers.get("x-real-ip") || "local"
  return createHash("sha256").update(`${chatSecret()}:${ip}`).digest("hex")
}
