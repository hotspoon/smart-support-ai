import { z } from "zod"

import { getDb } from "@/lib/db"

const querySchema = z.object({
  status: z.enum(["OPEN", "WAITING", "RESOLVED"]).optional(),
  workspace: z
    .string()
    .min(1)
    .default(process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop"),
})

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const query = querySchema.parse({
      status: url.searchParams.get("status") ?? undefined,
      workspace: url.searchParams.get("workspace") ?? undefined,
    })
    const data = await getDb().conversation.findMany({
      where: { workspace: { slug: query.workspace }, status: query.status },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memuat percakapan",
      },
      { status: 503 }
    )
  }
}
