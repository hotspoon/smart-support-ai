import { z } from "zod"

import { getDb } from "@/lib/db"

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(200),
  content: z.string().min(3).max(10_000),
  category: z.string().min(1).max(80).default("Umum"),
  workspace: z
    .string()
    .min(1)
    .default(process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop"),
})

export async function GET() {
  try {
    const data = await getDb().knowledgeBase.findMany({
      where: {
        workspace: { slug: process.env.DEFAULT_WORKSPACE_SLUG ?? "halo-shop" },
      },
      orderBy: { updatedAt: "desc" },
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal memuat knowledge base",
      },
      { status: 503 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const input = articleSchema.parse(await request.json())
    const data = await getDb().knowledgeBase.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        workspace: { connect: { slug: input.workspace } },
      },
    })
    return Response.json({ data }, { status: 201 })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Artikel tidak valid" },
      { status: 400 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const input = articleSchema
      .extend({ id: z.string().min(1) })
      .parse(await request.json())
    const data = await getDb().knowledgeBase.update({
      where: { id: input.id },
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
      },
    })
    return Response.json({ data })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Artikel tidak valid" },
      { status: 400 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = z
      .object({ id: z.string().min(1) })
      .parse(await request.json())
    await getDb().knowledgeBase.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Artikel gagal dihapus",
      },
      { status: 400 }
    )
  }
}
