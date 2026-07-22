"use client"

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  Bot,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

type Message = {
  id: string
  sender: "USER" | "AI" | "ADMIN"
  content: string
  createdAt: string
}
type Conversation = {
  id: string
  status: "OPEN" | "WAITING" | "RESOLVED"
  customerName: string
  workspace: { name: string; brandColor: string; welcomeMessage: string; businessHours: string }
  feedbackSubmitted: boolean
}
type MessagesPayload = {
  data: Message[]
  nextCursor: string | null
  conversation: Conversation
}
type SendPayload = { message: string; clientMessageId: string }

function mergePages(pages: MessagesPayload[] | undefined) {
  const unique = new Map<string, Message>()
  for (const page of [...(pages ?? [])].reverse()) {
    for (const message of page.data) unique.set(message.id, message)
  }
  return [...unique.values()].sort(
    (left, right) =>
      new Date(left.createdAt).getTime() -
        new Date(right.createdAt).getTime() || left.id.localeCompare(right.id)
  )
}

class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

async function request<T>(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  const payload = (await response.json().catch(() => null)) as
    (T & { error?: string }) | null
  if (!response.ok)
    throw new RequestError(
      payload?.error ?? "Permintaan gagal",
      response.status
    )
  return payload as T
}

export function PublicChat() {
  const client = useQueryClient()
  const [draft, setDraft] = useState("")
  const [retryMessage, setRetryMessage] = useState<SendPayload | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const messages = useInfiniteQuery({
    queryKey: ["public-messages"],
    queryFn: ({ pageParam }) =>
      request<MessagesPayload>(
        `/api/public/messages?limit=50${pageParam ? `&cursor=${pageParam}` : ""}`
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    retry: false,
    refetchInterval: (query) => (query.state.data ? 3_000 : false),
  })
  const send = useMutation({
    mutationFn: (payload: SendPayload) =>
      request<{ status: "answered" | "failed" | "pending" }>(
        "/api/public/messages",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      ),
    onSuccess: () => {
      setRetryMessage(null)
      void client.invalidateQueries({ queryKey: ["public-messages"] })
    },
    onError: (_error, payload) => setRetryMessage(payload),
  })
  const feedback = useMutation({
    mutationFn: () => request("/api/public/feedback", { method: "POST", body: JSON.stringify({ rating, comment: comment.trim() || undefined }) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["public-messages"] }),
  })

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = draft.trim()
    if (!value || send.isPending) return
    setDraft("")
    setRetryMessage(null)
    send.mutate({ message: value, clientMessageId: crypto.randomUUID() })
  }

  if (messages.isLoading) return <ChatLoading />
  if (
    !messages.data &&
    messages.error instanceof RequestError &&
    messages.error.status === 401
  )
    return <StartChat onStarted={() => void messages.refetch()} />
  if (!messages.data)
    return (
      <FullError
        message={messages.error?.message ?? "Chat tidak dapat dibuka."}
        onRetry={() => void messages.refetch()}
      />
    )

  const conversation = messages.data.pages[0].conversation
  const workspace = conversation.workspace
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.14),_transparent_34%),linear-gradient(to_bottom_right,#fafafa,#f4f4f5)] p-3 sm:grid sm:place-items-center sm:p-6 dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.13),_transparent_34%),linear-gradient(to_bottom_right,#09090b,#18181b)]">
      <section className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border bg-white shadow-2xl shadow-zinc-950/10 sm:h-[min(780px,calc(100vh-3rem))] dark:bg-zinc-900">
        <header className="flex items-center gap-3 border-b p-4 sm:p-5">
          <div className="relative grid size-11 place-items-center rounded-2xl text-white" style={{ backgroundColor: workspace.brandColor }}>
            <Bot className="size-5" />
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-emerald-400 dark:border-zinc-900" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-heading font-extrabold">{workspace.name} Support</h1>
            <p className="text-xs text-zinc-500">
              AI assistant · admin siap membantu jika perlu
            </p>
          </div>
          <span
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-bold",
              conversation.status === "RESOLVED"
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : conversation.status === "OPEN"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            )}
          >
            {conversation.status === "RESOLVED" ? "Sudah selesai" : conversation.status === "WAITING" ? "Menunggu respons" : "Butuh respons"}
          </span>
        </header>
        <div
          ref={scrollRef}
          className="scrollbar-subtle flex-1 space-y-4 overflow-y-auto bg-zinc-50/70 p-4 sm:p-6 dark:bg-zinc-950/40"
        >
          <div className="mx-auto mb-6 max-w-md text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Sparkles className="size-5" />
            </div>
            <p className="mt-3 text-sm font-bold">
              Halo, {conversation.customerName}!
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              {workspace.welcomeMessage} Jam operasional: {workspace.businessHours}.
            </p>
          </div>
          {messages.hasNextPage && (
            <div className="text-center">
              <button
                disabled={messages.isFetchingNextPage}
                onClick={async () => {
                  const element = scrollRef.current
                  const previousHeight = element?.scrollHeight ?? 0
                  await messages.fetchNextPage()
                  requestAnimationFrame(() => {
                    if (element)
                      element.scrollTop += element.scrollHeight - previousHeight
                  })
                }}
                className="rounded-lg px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-500/10"
              >
                {messages.isFetchingNextPage
                  ? "Memuat..."
                  : "Muat pesan sebelumnya"}
              </button>
            </div>
          )}
          {mergePages(messages.data.pages).map((message) => (
            <CustomerBubble key={message.id} message={message} />
          ))}
          {send.isPending && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border bg-white px-4 py-3 text-sm text-zinc-500 dark:bg-zinc-900">
                <LoaderCircle className="size-4 animate-spin text-emerald-500" />
                AI sedang menyiapkan jawaban...
              </div>
            </div>
          )}
          {send.isError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              <p>Pesan belum berhasil dikirim.</p>
              <button
                className="mt-2 flex items-center gap-1 font-bold"
                onClick={() => retryMessage && send.mutate(retryMessage)}
              >
                <RotateCcw className="size-3.5" /> Coba lagi
              </button>
            </div>
          )}
          {!send.isPending &&
            (send.data?.status === "failed" ||
              conversation.status === "OPEN") && (
              <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                <Clock3 className="mt-0.5 size-4 shrink-0" />
                <span>
                  AI sedang tidak tersedia. Pesanmu sudah tersimpan dan masuk
                  antrean admin.
                </span>
              </div>
            )}
          {conversation.status === "RESOLVED" && (
            <div className="flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
              <span>
                Percakapan ini sudah selesai. Kirim pesan baru untuk membuka
                percakapan baru.
              </span>
            </div>
          )}
          {conversation.status === "RESOLVED" && !conversation.feedbackSubmitted && (
            <div className="rounded-xl border bg-white p-4 text-center dark:bg-zinc-900">
              <p className="font-bold">Bagaimana pengalamanmu?</p>
              <div className="mt-3 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => <button key={value} onClick={() => setRating(value)} className={cn("rounded-lg px-3 py-2 text-lg", rating >= value ? "bg-amber-100 text-amber-600" : "bg-zinc-100 text-zinc-400")}>★</button>)}
              </div>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} maxLength={1000} placeholder="Komentar (opsional)" className="mt-3 w-full rounded-lg border p-2 text-sm" />
              <button disabled={!rating || feedback.isPending} onClick={() => feedback.mutate()} className="mt-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Kirim penilaian</button>
              {feedback.error && <p className="mt-2 text-xs text-red-600">{feedback.error.message}</p>}
            </div>
          )}
        </div>
        <form
          onSubmit={submit}
          className="border-t bg-white p-3 sm:p-4 dark:bg-zinc-900"
        >
          <div className="flex items-end gap-2">
            <textarea
              aria-label="Pesan"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  event.currentTarget.form?.requestSubmit()
                }
              }}
              rows={2}
              maxLength={5000}
              placeholder="Tulis pertanyaanmu..."
              className="min-h-12 flex-1 resize-none rounded-2xl border bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-zinc-950"
            />
            <button
              aria-label="Kirim"
              disabled={!draft.trim() || send.isPending}
              className="grid size-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-50"
            >
              <Send className="size-4.5" />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-zinc-400">
            <ShieldCheck className="size-3" />
            Jangan kirim password atau data kartu pembayaran
          </div>
        </form>
      </section>
    </main>
  )
}

function StartChat({ onStarted }: { onStarted: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const start = useMutation({
    mutationFn: () =>
      request("/api/public/conversations", {
        method: "POST",
        body: JSON.stringify({ ...form, clientMessageId: crypto.randomUUID() }),
      }),
    onSuccess: onStarted,
  })
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.10),_transparent_30%),#fafafa] p-4 sm:grid sm:place-items-center dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),#09090b]">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500 text-white shadow-xl shadow-emerald-500/25">
            <MessageCircle className="size-6" />
          </div>
          <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight">
            Ada yang bisa dibantu?
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Mulai chat dengan customer support kami.
          </p>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            start.mutate()
          }}
          className="rounded-3xl border bg-white p-6 shadow-2xl shadow-zinc-950/10 dark:bg-zinc-900"
        >
          <label className="block text-sm font-semibold">
            Nama
            <input
              required
              minLength={2}
              maxLength={100}
              autoComplete="name"
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Nama kamu"
              className="mt-2 w-full rounded-xl border bg-transparent p-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Email
            <input
              required
              type="email"
              maxLength={200}
              autoComplete="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="nama@email.com"
              className="mt-2 w-full rounded-xl border bg-transparent p-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Pertanyaan
            <textarea
              required
              maxLength={5000}
              rows={5}
              value={form.message}
              onChange={(event) =>
                setForm({ ...form, message: event.target.value })
              }
              placeholder="Contoh: Bagaimana cara mengajukan refund?"
              className="mt-2 w-full resize-none rounded-xl border bg-transparent p-3 font-normal outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          {start.error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-300">
              {start.error.message}
            </p>
          )}
          <button
            disabled={start.isPending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
          >
            {start.isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Menyiapkan chat...
              </>
            ) : (
              <>
                Mulai chat <Send className="size-4" />
              </>
            )}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-zinc-400">
          Dengan memulai chat, pesan akan disimpan untuk kebutuhan layanan.
        </p>
      </div>
    </main>
  )
}

function CustomerBubble({ message }: { message: Message }) {
  const own = message.sender === "USER"
  return (
    <div className={cn("flex", own ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          own
            ? "rounded-br-md bg-emerald-500 text-white"
            : "rounded-bl-md border bg-white dark:bg-zinc-900"
        )}
      >
        <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase opacity-70">
          {message.sender === "AI" && <Bot className="size-3" />}
          {message.sender === "ADMIN" ? "Support agent" : message.sender}
        </div>
        <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <time
          className={cn(
            "mt-1 block text-[10px]",
            own ? "text-emerald-50" : "text-zinc-400"
          )}
        >
          {new Date(message.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  )
}

function ChatLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-7 animate-spin text-emerald-500" />
        <p className="mt-3 text-sm text-zinc-500">Membuka chat...</p>
      </div>
    </main>
  )
}
function FullError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-4 dark:bg-zinc-950">
      <div className="max-w-sm rounded-2xl border bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
        <p className="font-bold">Chat belum dapat dibuka</p>
        <p className="mt-2 text-sm text-zinc-500">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
        >
          Coba lagi
        </button>
      </div>
    </main>
  )
}
