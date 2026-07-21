import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { ApiError } from "@/lib/server/api"

export type AppRole = "ADMIN" | "AGENT"

export async function requireSession(roles: AppRole[] = ["ADMIN", "AGENT"]) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new ApiError(401, "Silakan login terlebih dahulu")

  const user = session.user as typeof session.user & {
    workspaceId?: string
    role?: AppRole
  }
  if (!user.workspaceId || !user.role)
    throw new ApiError(403, "Akun belum terhubung ke workspace")
  if (!roles.includes(user.role))
    throw new ApiError(403, "Kamu tidak memiliki akses untuk tindakan ini")

  return { session, user, workspaceId: user.workspaceId, role: user.role }
}
