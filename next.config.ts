import type { NextConfig } from "next"

if (process.env.NODE_ENV === "production") {
  const authSecret = process.env.BETTER_AUTH_SECRET
  const chatSecret = process.env.CHAT_SESSION_SECRET
  if (!authSecret || authSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET minimal 32 karakter di production")
  }
  if (!chatSecret || chatSecret.length < 32) {
    throw new Error("CHAT_SESSION_SECRET minimal 32 karakter di production")
  }
  if (authSecret === chatSecret) {
    throw new Error(
      "CHAT_SESSION_SECRET harus berbeda dari BETTER_AUTH_SECRET di production"
    )
  }
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
}

export default nextConfig
