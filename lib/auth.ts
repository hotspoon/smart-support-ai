import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"

import { getDb } from "@/lib/db"

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  secret:
    process.env.BETTER_AUTH_SECRET ??
    (process.env.VERCEL
      ? undefined
      : "local-development-secret-change-before-deploy"),
  database: prismaAdapter(getDb(), { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: process.env.AUTH_DISABLE_SIGN_UP !== "false",
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      // The request must not provide this tenant boundary. The create hook below
      // resolves it server-side before Prisma inserts the required DB column.
      workspaceId: { type: "string", required: false, input: false },
      role: {
        type: ["ADMIN", "AGENT"],
        required: true,
        defaultValue: "AGENT",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const workspace = await getDb().workspace.findUnique({
            where: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop" },
            select: { id: true },
          })
          if (!workspace) throw new Error("Workspace default belum dibuat")
          return { data: { ...user, workspaceId: workspace.id, role: "ADMIN" } }
        },
      },
    },
  },
})
