import { z } from "zod"

import { getDb } from "@/lib/db"

const settingSchema = z.object({
  systemPrompt: z.string().min(20).max(10_000),
  temperature: z.number().min(0).max(2),
  model: z.string().min(1).max(100),
  autoReply: z.boolean(),
  fallbackToAgent: z.boolean().default(true),
})

const workspaceSlug = process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop"

export async function GET() {
  try {
    const data = await getDb().promptSetting.findFirst({
      where: { workspace: { slug: workspaceSlug } },
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memuat pengaturan",
      },
      { status: 503 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const input = settingSchema.parse(await request.json())
    const workspace = await getDb().workspace.findUniqueOrThrow({
      where: { slug: workspaceSlug },
      select: { id: true },
    })
    const data = await getDb().promptSetting.upsert({
      where: { workspaceId: workspace.id },
      create: { ...input, workspaceId: workspace.id },
      update: input,
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Pengaturan tidak valid",
      },
      { status: 400 }
    )
  }
}
