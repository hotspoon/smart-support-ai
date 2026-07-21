import type { Metadata } from "next"

import { PublicChat } from "@/components/chat/public-chat"

export const metadata: Metadata = {
  title: "Chat Support — Halo Shop",
  description: "Hubungi customer support Halo Shop.",
}

export default function ChatPage() {
  return <PublicChat />
}
