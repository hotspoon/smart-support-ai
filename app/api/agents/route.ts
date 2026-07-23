import { hashPassword } from "better-auth/crypto"
import { z } from "zod"

import { getDb } from "@/lib/db"
import {
  ApiError,
  apiError,
  isPrismaUniqueError,
} from "@/lib/server/api"
import { requireSession } from "@/lib/server/auth"

const createAgentSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(8).max(128),
  })
  .strict()

const resetPasswordSchema = z
  .object({
    userId: z.string().min(1),
    password: z.string().min(8).max(128),
  })
  .strict()

export async function GET() {
  try {
    const { workspaceId, role } = await requireSession()
    const data = await getDb().user.findMany({
      where: { workspaceId },
      select: {
        id: true,
        name: true,
        email: role === "ADMIN",
        role: true,
        image: true,
        createdAt: role === "ADMIN",
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    })
    return Response.json({ data })
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = createAgentSchema.parse(await request.json())
    const password = await hashPassword(input.password)

    const data = await getDb().$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          workspaceId,
          name: input.name,
          email: input.email,
          emailVerified: false,
          role: "AGENT",
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
          createdAt: true,
        },
      })
      await transaction.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          accountId: user.id,
          providerId: "credential",
          password,
        },
      })
      return user
    })

    return Response.json({ data }, { status: 201 })
  } catch (error) {
    if (isPrismaUniqueError(error))
      return apiError(new ApiError(409, "Email sudah digunakan"))
    return apiError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { workspaceId } = await requireSession(["ADMIN"])
    const input = resetPasswordSchema.parse(await request.json())
    const agent = await getDb().user.findFirst({
      where: { id: input.userId, workspaceId, role: "AGENT" },
      select: { id: true },
    })
    if (!agent) throw new ApiError(404, "Agent tidak ditemukan")

    const password = await hashPassword(input.password)
    await getDb().$transaction(async (transaction) => {
      const credential = await transaction.account.findFirst({
        where: { userId: agent.id, providerId: "credential" },
        select: { id: true },
      })
      if (credential) {
        await transaction.account.update({
          where: { id: credential.id },
          data: { password },
        })
      } else {
        await transaction.account.create({
          data: {
            id: crypto.randomUUID(),
            userId: agent.id,
            accountId: agent.id,
            providerId: "credential",
            password,
          },
        })
      }
      await transaction.session.deleteMany({ where: { userId: agent.id } })
    })

    return new Response(null, { status: 204 })
  } catch (error) {
    return apiError(error)
  }
}
