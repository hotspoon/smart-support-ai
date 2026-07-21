import { ZodError } from "zod"

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public headers?: HeadersInit
  ) {
    super(message)
  }
}

export function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  )
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json(
      { error: error.message },
      { status: error.status, headers: error.headers }
    )
  }
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Data tidak valid", issues: error.issues },
      { status: 400 }
    )
  }
  const requestId = crypto.randomUUID()
  console.error("API request failed", {
    requestId,
    errorName: error instanceof Error ? error.name : "UnknownError",
  })
  return Response.json(
    { error: "Terjadi kesalahan pada server", requestId },
    { status: 500 }
  )
}
