import type { Metadata } from "next"

import { PublicChat } from "@/components/chat/public-chat"
import { getDb } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function generateMetadata(): Promise<Metadata> {
  const workspace = await getDb().workspace.findUnique({
    where: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop" },
    select: { name: true },
  })
  const name = workspace?.name ?? "Customer Support"
  return { title: `Chat Support — ${name}`, description: `Hubungi customer support ${name}.` }
}

export default function ChatPage() {
  return <PublicChat />
}
