import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  welcomeMessage: z.string().trim().min(2).max(500),
  businessHours: z.string().trim().min(2).max(200),
  completeOnboarding: z.boolean().optional(),
  addSamples: z.boolean().optional(),
}).strict()

const select = { name: true, slug: true, brandColor: true, welcomeMessage: true, businessHours: true, onboardingCompletedAt: true } as const

export async function GET() {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const data = await getDb().workspace.findUniqueOrThrow({ where: { id: workspaceId }, select })
    return Response.json({ data })
  } catch (error) { return apiError(error) }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = schema.parse(await request.json())
    const { addSamples, completeOnboarding, ...workspace } = input
    const data = await getDb().$transaction(async (db) => {
      if (addSamples) {
        await db.knowledgeBase.createMany({ data: [
          { workspaceId, title: "Cara menghubungi support", category: "Umum", content: "Tim support siap membantu selama jam operasional yang tertera di chat." },
          { workspaceId, title: "Status pesanan", category: "Pesanan", content: "Minta pelanggan menyiapkan nomor pesanan agar tim dapat membantu mengecek statusnya." },
          { workspaceId, title: "Kebijakan pengembalian", category: "Pembayaran", content: "Jelaskan kebijakan pengembalian bisnis Anda secara akurat sebelum menjanjikan hasil kepada pelanggan." },
        ], skipDuplicates: true })
      }
      return db.workspace.update({ where: { id: workspaceId }, data: { ...workspace, onboardingCompletedAt: completeOnboarding ? new Date() : undefined }, select })
    })
    return Response.json({ data })
  } catch (error) { return apiError(error) }
}
