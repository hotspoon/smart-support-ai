import { z } from "zod"

import { getDb } from "@/lib/db"
import { apiError } from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const querySchema = z.object({ range: z.enum(["7d", "30d"]).default("7d") })
const jakartaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

function jakartaDate(value: Date) {
  const parts = Object.fromEntries(
    jakartaDateFormatter
      .formatToParts(value)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

export async function GET(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const { range } = querySchema.parse({
      range: new URL(request.url).searchParams.get("range") ?? "7d",
    })
    const days = range === "30d" ? 30 : 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    const conversations = await getDb().conversation.findMany({
      where: { workspaceId, createdAt: { gte: since } },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    })
    const feedback = await getDb().conversationFeedback.aggregate({
      where: { conversation: { workspaceId }, createdAt: { gte: since } },
      _avg: { rating: true }, _count: { rating: true },
    })
    const today = jakartaDate(new Date())
    const todayRows = conversations.filter(
      (item) => jakartaDate(item.createdAt) === today
    )
    const resolved = conversations.filter((item) => item.status === "RESOLVED")
    const responseTimes = conversations.flatMap((item) => {
      const firstUser = item.messages.find(
        (message) => message.sender === "USER"
      )
      const firstReply =
        firstUser &&
        item.messages.find(
          (message) =>
            message.sender !== "USER" && message.createdAt > firstUser.createdAt
        )
      return firstUser && firstReply
        ? [firstReply.createdAt.getTime() - firstUser.createdAt.getTime()]
        : []
    })
    const volumeMap = new Map<
      string,
      { date: string; conversations: number; resolved: number }
    >()
    for (let offset = days - 1; offset >= 0; offset--) {
      const date = jakartaDate(
        new Date(Date.now() - offset * 86_400_000)
      )
      volumeMap.set(date, { date, conversations: 0, resolved: 0 })
    }
    for (const item of conversations) {
      const bucket = volumeMap.get(jakartaDate(item.createdAt))
      if (bucket) {
        bucket.conversations++
        if (item.status === "RESOLVED") bucket.resolved++
      }
    }
    const topMap = new Map<string, number>()
    for (const item of conversations) {
      const subject = item.subject?.trim()
      if (subject) topMap.set(subject, (topMap.get(subject) ?? 0) + 1)
    }
    const data = {
      today: {
        conversations: todayRows.length,
        open: todayRows.filter((item) => item.status === "OPEN").length,
        waiting: todayRows.filter((item) => item.status === "WAITING").length,
        resolved: todayRows.filter((item) => item.status === "RESOLVED").length,
      },
      totals: {
        conversations: conversations.length,
        aiResolutionRate: resolved.length
          ? Math.round(
              (resolved.filter((item) => item.resolutionSource === "AI")
                .length /
                resolved.length) *
                100
            )
          : 0,
        averageResponseMs: responseTimes.length
          ? Math.round(
              responseTimes.reduce((sum, value) => sum + value, 0) /
                responseTimes.length
            )
          : 0,
        escalations: conversations.filter((item) =>
          item.messages.some((message) => message.sender === "ADMIN")
        ).length,
        csatAverage: feedback._avg.rating ? Math.round(feedback._avg.rating * 10) / 10 : null,
        csatResponses: feedback._count.rating,
      },
      volume: [...volumeMap.values()],
      topQuestions: [...topMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([question, count]) => ({ question, count })),
    }
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}
