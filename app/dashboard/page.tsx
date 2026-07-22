import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { LiveSupportDesk } from "@/components/support/live-support-desk"
import { auth } from "@/lib/auth"

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")
  const user = session.user as typeof session.user & {
    role?: "ADMIN" | "AGENT"
  }
  return (
    <LiveSupportDesk
      user={{ name: user.name, email: user.email, role: user.role ?? "AGENT" }}
    />
  )
}
