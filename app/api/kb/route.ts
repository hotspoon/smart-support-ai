import { z } from "zod"

import { getDb } from "@/lib/db"
import { ApiError, apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3).max(200),
  content: z.string().min(3).max(10_000),
  category: z.string().min(1).max(80).default("Umum"),
})

export async function GET() {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const data = await getDb().knowledgeBase.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: "desc" },
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = articleSchema.parse(await request.json())
    const data = await getDb().knowledgeBase.create({
      data: {
        title: input.title,
        content: input.content,
        category: input.category,
        workspaceId,
      },
    })
    return Response.json({ data }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = articleSchema
      .extend({ id: z.string().min(1) })
      .parse(await request.json())
    const owned = await getDb().knowledgeBase.findFirst({
      where: { id: input.id, workspaceId },
    })
    if (!owned) throw new ApiError(404, "Artikel tidak ditemukan")
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
    return apiError(error)
  }
}

export async function DELETE(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const { id } = z
      .object({ id: z.string().min(1) })
      .parse(await request.json())
    const owned = await getDb().knowledgeBase.findFirst({
      where: { id, workspaceId },
    })
    if (!owned) throw new ApiError(404, "Artikel tidak ditemukan")
    await getDb().knowledgeBase.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    return apiError(error)
  }
}
