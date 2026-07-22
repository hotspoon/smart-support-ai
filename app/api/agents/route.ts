import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

export async function GET() {
  try {
    const { workspaceId } = await requireSession()
    const data = await getDb().user.findMany({
      where: { workspaceId },
      select: { id: true, name: true, role: true, image: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}
