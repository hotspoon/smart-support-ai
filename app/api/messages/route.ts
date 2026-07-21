import { z } from "zod"

import { getDb } from "@/lib/db"

const querySchema = z.object({ conversationId: z.string().min(1) })

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = querySchema.parse({
      conversationId: url.searchParams.get("conversationId"),
    })
    const data = await getDb().message.findMany({
      where: { conversationId: query.conversationId },
      orderBy: { createdAt: "asc" },
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Gagal memuat pesan" },
      { status: 400 }
    )
  }
}
