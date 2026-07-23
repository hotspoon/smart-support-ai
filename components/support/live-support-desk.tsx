"use client"

import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleHelp,
  Clock3,
  FileText,
  Inbox,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Plus,
  Search,
  Send,
  Settings,
  SidebarClose,
  Sparkles,
  Trash2,
  UserPlus,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useRef, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type View =
  | "dashboard"
  | "inbox"
  | "knowledge"
  | "analytics"
  | "team"
  | "settings"
type Status = "OPEN" | "WAITING" | "RESOLVED"
type Conversation = {
  id: string
  customerName: string
  customerEmail: string
  status: Status
  subject: string | null
  tags: string[]
  lastMessageAt: string
  assignedTo: { id: string; name: string } | null
  needsAttention?: boolean
  messages: {
    content: string
    sender: "USER" | "AI" | "ADMIN"
    createdAt: string
  }[]
}
type Agent = {
  id: string
  name: string
  email?: string
  role: "ADMIN" | "AGENT"
  image: string | null
  createdAt?: string
}
type ConversationPage = {
  data: Conversation[]
  nextCursor: string | null
}
type ConversationPatch = {
  status?: Status
  assignedToId?: string | null
  tags?: string[]
}
type Message = {
  id: string
  sender: "USER" | "AI" | "ADMIN"
  content: string
  createdAt: string
  clientMessageId?: string | null
}
type MessagesPage = { data: Message[]; nextCursor: string | null }

function mergeMessagePages(pages: MessagesPage[] | undefined) {
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
type Article = {
  id: string
  title: string
  content: string
  category: string
  updatedAt: string
}
type Analytics = {
  today: {
    conversations: number
    open: number
    waiting: number
    resolved: number
  }
  totals: {
    conversations: number
    aiResolutionRate: number
    averageResponseMs: number
    escalations: number
  }
  volume: { date: string; conversations: number; resolved: number }[]
  topQuestions: { question: string; count: number }[]
}
type Setting = {
  systemPrompt: string
  temperature: number
  autoReply: boolean
  maxHistory: number
}
type WorkspaceSetting = {
  name: string
  slug: string
  brandColor: string
  welcomeMessage: string
  businessHours: string
  onboardingCompletedAt: string | null
}
type NotificationItem = {
  id: string
  conversationId: string
  lastEventAt: string
  readAt: string | null
  conversation: { customerName: string; subject: string | null }
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    throw new Error(payload?.error ?? "Permintaan gagal")
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

const navItems: {
  id: View
  label: string
  icon: typeof LayoutDashboard
  adminOnly?: boolean
}[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, adminOnly: true },
  { id: "analytics", label: "Analytics", icon: BarChart3, adminOnly: true },
  { id: "team", label: "Tim", icon: UsersRound, adminOnly: true },
  { id: "settings", label: "AI Settings", icon: Settings, adminOnly: true },
]

const pageMeta: Record<View, { eyebrow: string; title: string }> = {
  dashboard: { eyebrow: "Overview", title: "Dashboard" },
  inbox: { eyebrow: "Workspace", title: "Inbox" },
  knowledge: { eyebrow: "AI resources", title: "Knowledge base" },
  analytics: { eyebrow: "Insights", title: "Analytics" },
  team: { eyebrow: "Workspace", title: "Tim" },
  settings: { eyebrow: "Workspace", title: "AI settings" },
}

export function LiveSupportDesk({
  user,
}: {
  user: { name: string; email: string; role: "ADMIN" | "AGENT" }
}) {
  const [view, setView] = useState<View>("dashboard")
  const [mobileNav, setMobileNav] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState("")
  const { resolvedTheme, setTheme } = useTheme()
  const allowedNav = navItems.filter(
    (item) => !item.adminOnly || user.role === "ADMIN"
  )
  const sidebarAnalytics = useAnalytics("7d", user.role === "ADMIN")
  const notifications = useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{ data: NotificationItem[]; unread: number }>("/api/notifications"),
    refetchInterval: 10_000,
  })
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: () => api<{ data: WorkspaceSetting }>("/api/workspace"),
    enabled: user.role === "ADMIN",
  })
  const automationRate =
    sidebarAnalytics.data?.data.totals.aiResolutionRate ?? 0

  function navigate(next: View) {
    setView(next)
    setMobileNav(false)
  }

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    setSignOutError("")
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setSignOutError("Gagal keluar. Coba lagi.")
        setSigningOut(false)
        return
      }
      location.replace("/login")
    } catch {
      setSignOutError("Gagal keluar. Periksa koneksi internet.")
      setSigningOut(false)
    }
  }

  return (
    <div className="flex h-svh min-h-[600px] overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      {mobileNav && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-zinc-200/70 bg-white px-4 py-5 transition-transform duration-300 lg:static lg:translate-x-0 dark:border-white/10 dark:bg-zinc-950",
          mobileNav ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center px-2">
          <Brand />
          <button
            aria-label="Tutup menu"
            className="ml-auto rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 lg:hidden dark:hover:bg-white/5"
            onClick={() => setMobileNav(false)}
          >
            <X className="size-4" />
          </button>
        </div>
        <nav className="mt-9 space-y-1" aria-label="Navigasi utama">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-zinc-400 uppercase">
            Workspace
          </p>
          {allowedNav
            .filter((item) => item.id !== "settings" && item.id !== "team")
            .map((item) => (
              <NavButton
                key={item.id}
                item={item}
                active={view === item.id}
                onClick={() => navigate(item.id)}
              />
            ))}
          {user.role === "ADMIN" && (
            <>
              <p className="mt-7 mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-zinc-400 uppercase">
                Manage
              </p>
              <NavButton
                item={navItems.find((item) => item.id === "team")!}
                active={view === "team"}
                onClick={() => navigate("team")}
              />
              <NavButton
                item={navItems.find((item) => item.id === "settings")!}
                active={view === "settings"}
                onClick={() => navigate("settings")}
              />
            </>
          )}
        </nav>
        <div className="mt-auto">
          {user.role === "ADMIN" && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 dark:border-emerald-500/15 dark:from-emerald-500/10 dark:to-transparent">
              <div className="mb-3 flex items-center justify-between">
                <Sparkles className="size-4 text-emerald-600" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                  {automationRate}% AUTOMATED
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${automationRate}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                Data resolusi AI dari Neon.
              </p>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-xl p-2 hover:bg-zinc-50 dark:hover:bg-white/5">
            <div className="grid size-9 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
              {initials(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{user.name}</p>
              <p className="truncate text-[10px] text-zinc-400">
                {user.role === "ADMIN" ? "Administrator" : "Support agent"}
              </p>
            </div>
            <button
              type="button"
              aria-label={signingOut ? "Sedang keluar" : "Keluar"}
              title={signingOut ? "Sedang keluar..." : "Keluar"}
              disabled={signingOut}
              onClick={() => void handleSignOut()}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-white/5 dark:hover:text-zinc-200"
            >
              {signingOut ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
            </button>
          </div>
          {signOutError && (
            <p role="alert" className="mt-2 px-2 text-[10px] text-rose-600">
              {signOutError}
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center border-b border-zinc-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-7 dark:border-white/10 dark:bg-zinc-950/80">
          <button
            className="mr-3 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-white/5"
            aria-label="Buka menu"
            onClick={() => setMobileNav(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[.18em] text-emerald-600 uppercase">
              {pageMeta[view].eyebrow}
            </p>
            <h1 className="truncate font-heading text-lg font-extrabold tracking-tight sm:text-xl">
              {pageMeta[view].title}
            </h1>
          </div>
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              aria-label="Ganti tema"
              className="hidden h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-500 hover:bg-zinc-50 sm:flex dark:border-white/10 dark:hover:bg-white/5"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              <span className="size-2 rounded-full bg-emerald-500" /> Tema{" "}
              <ChevronDown className="size-3" />
            </button>
            <button
              aria-label="Notifikasi"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <Bell className="size-4" />
              {(notifications.data?.unread ?? 0) > 0 && (
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
              )}
            </button>
            {showNotifications && (
              <div className="absolute top-16 right-4 z-50 w-80 rounded-2xl border bg-white p-3 shadow-xl dark:bg-zinc-900">
                <p className="px-2 pb-2 text-xs font-bold">Notifikasi</p>
                {notifications.data?.data.length ? (
                  notifications.data.data.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setView("inbox")
                        setShowNotifications(false)
                        void api(
                          `/api/notifications/${item.conversationId}/read`,
                          { method: "POST" }
                        ).then(() => notifications.refetch())
                      }}
                      className="block w-full rounded-xl p-2 text-left hover:bg-zinc-50 dark:hover:bg-white/5"
                    >
                      <p className="text-xs font-bold">
                        Pesan baru dari {item.conversation.customerName}
                      </p>
                      <p className="mt-1 truncate text-[10px] text-zinc-500">
                        {item.conversation.subject ?? "Percakapan customer"}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="p-2 text-xs text-zinc-500">
                    Belum ada notifikasi.
                  </p>
                )}
              </div>
            )}
            <button
              aria-label="Bantuan"
              className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5"
            >
              <CircleHelp className="size-4" />
            </button>
          </div>
        </header>
        <main className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-y-auto">
          {view === "dashboard" && (
            <Dashboard
              onOpenInbox={() => setView("inbox")}
              role={user.role}
              userName={user.name}
            />
          )}
          {view === "inbox" && <InboxView />}
          {view === "knowledge" && user.role === "ADMIN" && <KnowledgeView />}
          {view === "analytics" && user.role === "ADMIN" && <AnalyticsView />}
          {view === "team" && user.role === "ADMIN" && <TeamView />}
          {view === "settings" && user.role === "ADMIN" && <SettingsView />}
        </main>
        {user.role === "ADMIN" &&
          workspace.data?.data.onboardingCompletedAt === null && (
            <OnboardingWizard
              initial={workspace.data.data}
              onComplete={() => void workspace.refetch()}
            />
          )}
      </div>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/sahutaja_logo.png"
        alt="SahutAja AI Customer Service"
        width={352}
        height={192}
        className="h-auto w-36 object-contain object-left"
      />
    </div>
  )
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: (typeof navItems)[number]
  active: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
      )}
    >
      <Icon className={cn("size-[18px]", active && "stroke-[2.3]")} />
      {item.label}
    </button>
  )
}

function Dashboard({
  onOpenInbox,
  role,
  userName,
}: {
  onOpenInbox: () => void
  role: "ADMIN" | "AGENT"
  userName: string
}) {
  const analytics = useAnalytics("7d", role === "ADMIN")
  const conversations = useQuery({
    queryKey: ["conversations", "dashboard"],
    queryFn: () => api<{ data: Conversation[] }>("/api/conversations?limit=5"),
    refetchInterval: 5_000,
  })
  if (conversations.isLoading || (role === "ADMIN" && analytics.isLoading))
    return <Loading />
  if (conversations.error || analytics.error)
    return (
      <ErrorState error={(conversations.error ?? analytics.error) as Error} />
    )
  const today = analytics.data?.data.today
  const cards: {
    label: string
    value: string | number
    icon: typeof Activity
    tone: string
    change: string
    down?: boolean
  }[] =
    role === "ADMIN"
      ? [
          {
            label: "Percakapan hari ini",
            value: today?.conversations ?? 0,
            icon: MessageCircle,
            tone: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300",
            change: "Live",
          },
          {
            label: "Diselesaikan",
            value: today?.resolved ?? 0,
            icon: Sparkles,
            tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300",
            change: `${analytics.data?.data.totals.aiResolutionRate ?? 0}% AI`,
          },
          {
            label: "Membutuhkan perhatian",
            value: (today?.open ?? 0) + (today?.waiting ?? 0),
            icon: Clock3,
            tone: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300",
            change: "Aktif",
            down: true,
          },
          {
            label: "Rata-rata respons",
            value: duration(analytics.data?.data.totals.averageResponseMs ?? 0),
            icon: Zap,
            tone: "bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300",
            change: "Aktual",
            down: true,
          },
        ]
      : [
          {
            label: "Percakapan terbaru",
            value: conversations.data?.data.length ?? 0,
            icon: MessageCircle,
            tone: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
            change: "Live",
          },
        ]
  const analyticsData = analytics.data?.data
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">
            Selamat datang, {userName.split(" ")[0]} <span>👋</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Berikut performa support hari ini, {jakartaToday()}.
          </p>
        </div>
        <button
          onClick={onOpenInbox}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-xs font-bold text-white shadow-lg shadow-zinc-950/10 hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          <Inbox className="size-4" />
          Buka inbox
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <MetricCard key={card.label} {...card} />
        ))}
      </div>
      {role === "ADMIN" && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.75fr)]">
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-900/50">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="font-heading text-base font-extrabold">
                  Volume percakapan
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  7 hari terakhir · Asia/Jakarta
                </p>
              </div>
              <span className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 dark:border-white/10">
                Mingguan <ChevronDown className="size-3" />
              </span>
            </div>
            <VolumeChart data={analyticsData?.volume ?? []} />
          </section>
          <section className="rounded-2xl border border-zinc-200/80 bg-zinc-950 p-6 text-white dark:border-white/10 dark:bg-emerald-950/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold tracking-[.16em] text-emerald-400 uppercase">
                  AI performance
                </p>
                <h3 className="mt-2 font-heading text-lg font-extrabold">
                  Resolusi otomatis
                </h3>
              </div>
              <div className="grid size-9 place-items-center rounded-xl bg-white/10">
                <Bot className="size-[18px] text-emerald-400" />
              </div>
            </div>
            <div className="mt-8 flex items-end gap-3">
              <span className="font-heading text-5xl font-extrabold tracking-[-.06em]">
                {analyticsData?.totals.aiResolutionRate ?? 0}%
              </span>
              <span className="mb-1.5 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
                Live
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Dihitung dari percakapan berstatus selesai pada periode aktif.
            </p>
            <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
                style={{
                  width: `${analyticsData?.totals.aiResolutionRate ?? 0}%`,
                }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
              <div>
                <p className="text-[10px] text-zinc-500">Total chat</p>
                <p className="mt-1 text-lg font-bold">
                  {analyticsData?.totals.conversations ?? 0}
                </p>
              </div>
              <div className="pl-5">
                <p className="text-[10px] text-zinc-500">Escalation</p>
                <p className="mt-1 text-lg font-bold">
                  {analyticsData?.totals.escalations ?? 0}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/5">
            <div>
              <h3 className="font-heading text-sm font-extrabold">
                Percakapan terbaru
              </h3>
              <p className="mt-0.5 text-[10px] text-zinc-400">
                Diperbarui setiap 5 detik
              </p>
            </div>
            <button
              onClick={onOpenInbox}
              className="text-[11px] font-bold text-emerald-600"
            >
              Lihat semua →
            </button>
          </div>
          <ConversationRows rows={conversations.data?.data ?? []} />
        </section>
        {role === "ADMIN" && (
          <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading text-sm font-extrabold">
                  Topik teratas
                </h3>
                <p className="mt-0.5 text-[10px] text-zinc-400">
                  7 hari terakhir
                </p>
              </div>
              <Activity className="size-4 text-emerald-500" />
            </div>
            <div className="mt-5 space-y-4">
              {(analyticsData?.topQuestions ?? []).slice(0, 4).map((item) => {
                const max = Math.max(
                  ...(analyticsData?.topQuestions ?? []).map(
                    (entry) => entry.count
                  ),
                  1
                )
                return (
                  <div key={item.question}>
                    <div className="mb-1.5 flex justify-between text-[11px]">
                      <span className="truncate font-medium">
                        {item.question}
                      </span>
                      <span className="font-bold text-zinc-400">
                        {item.count}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/5">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.max(8, (item.count / max) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
              {!analyticsData?.topQuestions.length && (
                <p className="text-xs text-zinc-400">Belum ada data topik.</p>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  tone,
  down = false,
}: {
  label: string
  value: string | number
  change: string
  icon: typeof Activity
  tone: string
  down?: boolean
}) {
  return (
    <div className="group rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.02)] transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-200/40 dark:border-white/10 dark:bg-zinc-900/50 dark:hover:shadow-none">
      <div className="flex items-start justify-between">
        <div className={cn("grid size-10 place-items-center rounded-xl", tone)}>
          <Icon className="size-[18px]" />
        </div>
        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          {down ? (
            <ArrowDownRight className="size-3" />
          ) : (
            <ArrowUpRight className="size-3" />
          )}
          {change}
        </span>
      </div>
      <p className="mt-5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
      <p className="mt-1 font-heading text-[28px] font-extrabold tracking-[-.04em]">
        {value}
      </p>
    </div>
  )
}

function InboxView() {
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<"" | Status>("")
  const [needsAttention, setNeedsAttention] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const conversations = useInfiniteQuery({
    queryKey: ["conversations", query, status, needsAttention],
    queryFn: ({ pageParam }) =>
      api<ConversationPage>(
        `/api/conversations?limit=30&query=${encodeURIComponent(query)}${status ? `&status=${status}` : ""}${needsAttention ? "&needsAttention=true" : ""}${pageParam ? `&cursor=${pageParam}` : ""}`
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 5_000,
  })
  const client = useQueryClient()
  const agents = useQuery({
    queryKey: ["agents"],
    queryFn: () => api<{ data: Agent[] }>("/api/agents"),
    staleTime: 60_000,
  })
  const updateConversation = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: ConversationPatch }) =>
      api(`/api/conversations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onMutate: async ({ id, patch }) => {
      await client.cancelQueries({ queryKey: ["conversations"] })
      const previous = client.getQueriesData<
        InfiniteData<ConversationPage, string>
      >({ queryKey: ["conversations"] })
      const assignedTo =
        patch.assignedToId === undefined
          ? undefined
          : patch.assignedToId === null
            ? null
            : (agents.data?.data.find(
                (agent) => agent.id === patch.assignedToId
              ) ?? null)
      client.setQueriesData<InfiniteData<ConversationPage, string>>(
        { queryKey: ["conversations"] },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conversation) =>
                    conversation.id === id
                      ? {
                          ...conversation,
                          ...(patch.status ? { status: patch.status } : {}),
                          ...(patch.tags ? { tags: patch.tags } : {}),
                          ...(assignedTo !== undefined
                            ? {
                                assignedTo: assignedTo
                                  ? {
                                      id: assignedTo.id,
                                      name: assignedTo.name,
                                    }
                                  : null,
                              }
                            : {}),
                        }
                      : conversation
                  ),
                })),
              }
            : current
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      for (const [key, value] of context?.previous ?? []) {
        client.setQueryData(key, value)
      }
    },
    onSettled: () =>
      void client.invalidateQueries({ queryKey: ["conversations"] }),
  })
  const rows = conversations.data?.pages.flatMap((page) => page.data) ?? []
  const activeId = selectedId ?? rows[0]?.id ?? null
  const activeConversation = rows.find((item) => item.id === activeId)
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      <section
        className={cn(
          "flex w-full shrink-0 flex-col border-r border-zinc-200/70 md:w-[330px] xl:w-[370px] dark:border-white/10",
          showDetail && "hidden md:flex"
        )}
      >
        <div className="border-b border-zinc-200/70 p-4 dark:border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading text-lg font-extrabold">
                Percakapan
              </h2>
              <p className="text-[10px] text-zinc-400">
                {rows.filter((row) => row.status !== "RESOLVED").length}{" "}
                membutuhkan perhatian
              </p>
            </div>
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-white">
              <PenLine className="size-4" />
            </span>
          </div>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, email, subjek..."
              className="mt-4 h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-xs outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto">
            <button
              onClick={() => {
                setNeedsAttention(!needsAttention)
                setStatus("")
              }}
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-[10px] font-bold whitespace-nowrap",
                needsAttention
                  ? "bg-amber-500 text-white"
                  : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
              )}
            >
              Butuh respons
            </button>
            {(["", "OPEN", "WAITING", "RESOLVED"] as const).map((value) => (
              <button
                key={value || "ALL"}
                onClick={() => {
                  setStatus(value)
                  setNeedsAttention(false)
                }}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[10px] font-bold whitespace-nowrap",
                  status === value
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                {value === ""
                  ? "Semua"
                  : value === "OPEN"
                    ? "Terbuka"
                    : value === "WAITING"
                      ? "Menunggu"
                      : "Selesai"}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto">
          {conversations.isLoading ? (
            <Loading compact />
          ) : conversations.error ? (
            <ErrorState error={conversations.error} />
          ) : (
            <>
              {rows.map((row) => (
                <ConversationItem
                  key={row.id}
                  row={row}
                  active={row.id === activeId}
                  onClick={() => {
                    setSelectedId(row.id)
                    setShowDetail(true)
                    void api(`/api/notifications/${row.id}/read`, {
                      method: "POST",
                    }).then(
                      () =>
                        void client.invalidateQueries({
                          queryKey: ["notifications"],
                        })
                    )
                  }}
                />
              ))}
              {conversations.hasNextPage && (
                <button
                  disabled={conversations.isFetchingNextPage}
                  onClick={() => void conversations.fetchNextPage()}
                  className="w-full p-3 text-xs font-bold text-emerald-600"
                >
                  {conversations.isFetchingNextPage
                    ? "Memuat..."
                    : "Muat lebih banyak"}
                </button>
              )}
            </>
          )}
        </div>
      </section>
      <section
        className={cn(
          "min-w-0 flex-1 flex-col",
          showDetail ? "flex" : "hidden md:flex"
        )}
      >
        {activeId ? (
          <ChatDetail
            conversationId={activeId}
            conversation={activeConversation}
            onBack={() => setShowDetail(false)}
            onUpdate={(patch) =>
              updateConversation.mutate({ id: activeId, patch })
            }
            updating={updateConversation.isPending}
          />
        ) : (
          <div className="text-center text-zinc-500">
            <MessageSquare className="mx-auto mb-3 size-8" />
            <p>Pilih percakapan</p>
          </div>
        )}
      </section>
      {activeConversation && (
        <CustomerPanel
          key={activeConversation.id}
          conversation={activeConversation}
          agents={agents.data?.data ?? []}
          disabled={updateConversation.isPending}
          error={updateConversation.error}
          onUpdate={(patch) =>
            updateConversation.mutate({ id: activeConversation.id, patch })
          }
        />
      )}
    </div>
  )
}

function CustomerPanel({
  conversation,
  agents,
  disabled,
  error,
  onUpdate,
}: {
  conversation: Conversation
  agents: Agent[]
  disabled: boolean
  error: Error | null
  onUpdate: (patch: ConversationPatch) => void
}) {
  const [tagDraft, setTagDraft] = useState("")

  function addTag() {
    const tag = tagDraft.trim()
    if (!tag || tag.length > 40 || conversation.tags.length >= 10) return
    const exists = conversation.tags.some(
      (current) => current.toLocaleLowerCase() === tag.toLocaleLowerCase()
    )
    setTagDraft("")
    if (!exists) onUpdate({ tags: [...conversation.tags, tag] })
  }

  return (
    <aside className="hidden w-[270px] shrink-0 border-l border-zinc-200/70 p-5 xl:block dark:border-white/10">
      <div className="text-center">
        <div className="flex justify-center">
          <Avatar name={conversation.customerName} size="lg" />
        </div>
        <p className="mt-3 text-sm font-bold">{conversation.customerName}</p>
        <p className="mt-1 text-[10px] text-zinc-400">
          {conversation.customerEmail}
        </p>
      </div>
      <div className="mt-6 space-y-5 border-t border-zinc-100 pt-5 dark:border-white/5">
        <div>
          <p className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
            Customer details
          </p>
          <div className="mt-3 space-y-3 text-[11px]">
            <div className="flex justify-between">
              <span className="text-zinc-400">Channel</span>
              <span className="font-semibold">WEB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Status</span>
              <StatusBadge status={conversation.status} />
            </div>
          </div>
        </div>
        <label className="block">
          <span className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
            Ditugaskan ke
          </span>
          <select
            aria-label="Assign agent"
            value={conversation.assignedTo?.id ?? ""}
            disabled={disabled}
            onChange={(event) =>
              onUpdate({ assignedToId: event.target.value || null })
            }
            className="mt-2 h-9 w-full rounded-xl border border-zinc-200 bg-transparent px-2 text-[10px] outline-none disabled:opacity-50 dark:border-white/10"
          >
            <option value="">Belum ditugaskan</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} · {agent.role}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
            Tags ({conversation.tags.length}/10)
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {conversation.tags.map((tag) => (
              <button
                key={tag}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onUpdate({
                    tags: conversation.tags.filter(
                      (current) => current !== tag
                    ),
                  })
                }
                title={`Hapus tag ${tag}`}
                className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-[9px] font-semibold hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:bg-white/5"
              >
                {tag} <X className="size-2.5" />
              </button>
            ))}
          </div>
          <input
            value={tagDraft}
            maxLength={40}
            disabled={disabled || conversation.tags.length >= 10}
            onChange={(event) => setTagDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault()
                addTag()
              }
            }}
            onBlur={addTag}
            placeholder="Tambah tag, lalu Enter"
            className="mt-2 h-9 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-[10px] outline-none focus:border-emerald-400 disabled:opacity-50 dark:border-white/10"
          />
        </div>
        {error && <p className="text-[10px] text-red-500">{error.message}</p>}
        <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="size-3.5" />
            AI context
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            {conversation.subject ?? "Percakapan customer dari web chat."}
          </p>
        </div>
      </div>
    </aside>
  )
}

function ConversationRows({ rows }: { rows: Conversation[] }) {
  if (!rows.length) return <Empty label="Belum ada percakapan." />
  return (
    <div>
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center gap-3 border-b border-zinc-100 px-5 py-3.5 last:border-0 hover:bg-zinc-50/80 dark:border-white/5 dark:hover:bg-white/[.025]"
        >
          <Avatar name={row.customerName} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-xs font-bold">{row.customerName}</p>
              <span className="text-[9px] text-zinc-400">WEB</span>
            </div>
            <p className="mt-1 truncate text-[11px] text-zinc-400">
              {row.messages[0]?.content ?? row.subject ?? "Belum ada pesan"}
            </p>
          </div>
          <StatusBadge status={row.status} />
          <time className="w-7 text-right text-[10px] text-zinc-400">
            {relative(row.lastMessageAt)}
          </time>
        </div>
      ))}
    </div>
  )
}

function ConversationItem({
  row,
  active,
  onClick,
}: {
  row: Conversation
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex w-full gap-3 border-b border-zinc-100 p-4 text-left transition dark:border-white/5",
        active
          ? "bg-emerald-50/65 dark:bg-emerald-500/[.07]"
          : "hover:bg-zinc-50 dark:hover:bg-white/[.025]"
      )}
    >
      {active && (
        <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-emerald-500" />
      )}
      <Avatar name={row.customerName} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-bold">{row.customerName}</p>
          <span className="shrink-0 text-[10px] text-zinc-400">
            {relative(row.lastMessageAt)}
          </span>
        </div>
        <p className="mt-1.5 truncate text-[11px] text-zinc-400">
          {row.messages[0]?.content ?? row.subject}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          <span
            className={cn(
              "size-1.5 rounded-full",
              row.status === "OPEN"
                ? "bg-sky-500"
                : row.status === "WAITING"
                  ? "bg-amber-500"
                  : "bg-emerald-500"
            )}
          />
          <span className="text-[9px] font-semibold text-zinc-400">WEB</span>
          {row.needsAttention && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
              SLA
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function ChatDetail({
  conversationId,
  conversation,
  onBack,
  onUpdate,
  updating,
}: {
  conversationId: string
  conversation?: Conversation
  onBack: () => void
  onUpdate: (patch: ConversationPatch) => void
  updating: boolean
}) {
  const client = useQueryClient()
  const [content, setContent] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const key = ["messages", conversationId]
  const messages = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) =>
      api<MessagesPage>(
        `/api/conversations/${conversationId}/messages?limit=50${pageParam ? `&cursor=${pageParam}` : ""}`
      ),
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 3_000,
  })
  const send = useMutation({
    mutationFn: (payload: { content: string; clientMessageId: string }) =>
      api<{ data: Message }>(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onMutate: async (payload) => {
      await client.cancelQueries({ queryKey: key })
      const previous =
        client.getQueryData<InfiniteData<MessagesPage, string>>(key)
      if (previous) {
        const optimistic: Message = {
          id: `temp-${payload.clientMessageId}`,
          sender: "ADMIN",
          content: payload.content,
          clientMessageId: payload.clientMessageId,
          createdAt: new Date().toISOString(),
        }
        client.setQueryData<InfiniteData<MessagesPage, string>>(key, {
          ...previous,
          pages: previous.pages.map((page, index) =>
            index === 0 ? { ...page, data: [...page.data, optimistic] } : page
          ),
        })
      }
      return { previous }
    },
    onError: (_error, _payload, context) =>
      client.setQueryData(key, context?.previous),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: key })
      void client.invalidateQueries({ queryKey: ["conversations"] })
    },
  })
  function submit(event: React.FormEvent) {
    event.preventDefault()
    const value = content.trim()
    if (!value) return
    setContent("")
    send.mutate({ content: value, clientMessageId: crypto.randomUUID() })
  }
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-[70px] shrink-0 items-center gap-3 border-b border-zinc-200/70 px-4 sm:px-5 dark:border-white/10">
        <button
          className="rounded-lg p-2 text-zinc-400 md:hidden"
          onClick={onBack}
        >
          <SidebarClose className="size-5" />
        </button>
        <Avatar name={conversation?.customerName ?? "?"} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-bold">
            {conversation?.customerName ?? "Customer"}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-400">
            <span className="size-1.5 rounded-full bg-emerald-500" /> Online ·
            WEB
          </p>
        </div>
        {conversation && (
          <select
            aria-label="Status"
            value={conversation.status}
            disabled={updating}
            onChange={(event) =>
              onUpdate({ status: event.target.value as Status })
            }
            className="h-9 rounded-xl border border-zinc-200 bg-transparent px-2 text-[10px] font-bold outline-none dark:border-white/10"
          >
            <option value="OPEN">Terbuka</option>
            <option value="WAITING">Menunggu</option>
            <option value="RESOLVED">Selesai</option>
          </select>
        )}
        <button
          aria-label="Menu percakapan"
          className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-400 dark:border-white/10"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </header>
      <div
        ref={scrollRef}
        className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-zinc-50/60 px-4 py-6 sm:px-8 dark:bg-black/10"
      >
        <div className="mx-auto max-w-3xl">
          {messages.hasNextPage && (
            <div className="mb-4 text-center">
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
                className="rounded-lg px-3 py-2 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 disabled:opacity-50 dark:hover:bg-emerald-500/10"
              >
                {messages.isFetchingNextPage
                  ? "Memuat..."
                  : "Muat pesan sebelumnya"}
              </button>
            </div>
          )}
          <div className="mb-6 flex items-center gap-3 text-[10px] text-zinc-400">
            <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            Hari ini
            <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
          </div>
          <div className="space-y-5">
            {messages.isLoading ? (
              <Loading compact />
            ) : messages.error ? (
              <ErrorState error={messages.error} />
            ) : (
              mergeMessagePages(messages.data?.pages).map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  customerName={conversation?.customerName ?? "?"}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <form
        onSubmit={submit}
        className="shrink-0 border-t border-zinc-200/70 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-zinc-950"
      >
        <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 p-2 shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5">
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
            rows={2}
            placeholder="Tulis balasan..."
            className="block w-full resize-none bg-transparent px-2 py-1 text-xs leading-relaxed outline-none placeholder:text-zinc-400"
          />
          <div className="mt-1 flex items-center">
            <span className="rounded-lg p-2 text-zinc-400">
              <Paperclip className="size-4" />
            </span>
            <span className="flex items-center gap-1.5 rounded-lg p-2 text-[10px] font-semibold text-emerald-600">
              <WandSparkles className="size-4" />
              AI suggest
            </span>
            <button
              disabled={!content.trim() || send.isPending}
              className="ml-auto grid size-8 place-items-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40"
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
        {send.error && (
          <p className="mt-2 text-xs text-red-500">{send.error.message}</p>
        )}
        <p className="mt-2 text-center text-[9px] text-zinc-400">
          Tekan Enter untuk mengirim · Shift + Enter untuk baris baru
        </p>
      </form>
    </div>
  )
}

function MessageBubble({
  message,
  customerName,
}: {
  message: Message
  customerName: string
}) {
  const own = message.sender !== "USER"
  return (
    <div className={cn("flex items-end gap-2.5", own && "flex-row-reverse")}>
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold",
          message.sender === "USER"
            ? "bg-violet-100 text-violet-700"
            : message.sender === "AI"
              ? "bg-emerald-500 text-white"
              : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
        )}
      >
        {message.sender === "USER" ? (
          initials(customerName)
        ) : message.sender === "AI" ? (
          <Bot className="size-3.5" />
        ) : (
          "AD"
        )}
      </div>
      <div className={cn("max-w-[82%] sm:max-w-[70%]", own && "text-right")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 text-left text-xs leading-relaxed shadow-sm",
            message.sender === "USER"
              ? "rounded-bl-md border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900"
              : message.sender === "AI"
                ? "rounded-br-md bg-emerald-500 text-white"
                : "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.sender === "AI" && (
            <div className="mt-2 flex items-center gap-1 border-t border-white/20 pt-2 text-[9px] text-emerald-50">
              <Sparkles className="size-3" />
              Dijawab dari knowledge base
            </div>
          )}
        </div>
        <p className="mt-1 px-1 text-[9px] text-zinc-400">
          {new Date(message.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          {own && "· Terkirim"}
        </p>
      </div>
    </div>
  )
}

function KnowledgeView() {
  const client = useQueryClient()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Article | null | "new">(null)
  const articles = useQuery({
    queryKey: ["kb"],
    queryFn: () => api<{ data: Article[] }>("/api/kb"),
  })
  const remove = useMutation({
    mutationFn: (id: string) =>
      api("/api/kb", { method: "DELETE", body: JSON.stringify({ id }) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["kb"] }),
  })
  const rows = (articles.data?.data ?? []).filter((item) =>
    `${item.title} ${item.content} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  )
  return (
    <div className="mx-auto w-full max-w-[1240px] p-4 sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Ajari AI tentang bisnismu
          </h2>
          <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            Jawaban yang akurat dimulai dari sumber pengetahuan yang terstruktur
            dan selalu diperbarui.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600"
        >
          <Plus className="size-4" />
          Tambah artikel
        </button>
      </div>
      <div className="mt-7 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-950 p-5 text-white dark:border-white/10">
          <div className="flex items-center justify-between">
            <BookOpen className="size-5 text-emerald-400" />
            <span className="text-[10px] font-bold text-emerald-400">
              AKTIF
            </span>
          </div>
          <p className="mt-5 font-heading text-3xl font-extrabold">
            {articles.data?.data.length ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Artikel pengetahuan</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
            <CheckCircle2 className="size-4" />
          </div>
          <p className="mt-4 font-heading text-2xl font-extrabold">Live</p>
          <p className="mt-1 text-xs text-zinc-400">Persisten di Neon</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10">
            <Activity className="size-4" />
          </div>
          <p className="mt-4 font-heading text-2xl font-extrabold">Groq</p>
          <p className="mt-1 text-xs text-zinc-400">
            Digunakan saat AI menjawab
          </p>
        </div>
      </div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-white/5">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari artikel..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-xs outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-400 sm:ml-auto">
            {rows.length} artikel
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-white/5">
          {articles.isLoading ? (
            <Loading />
          ) : articles.error ? (
            <ErrorState error={articles.error} />
          ) : rows.length ? (
            rows.map((article) => (
              <div
                key={article.id}
                className="group flex items-start gap-3 p-4 hover:bg-zinc-50/60 sm:items-center sm:px-5 dark:hover:bg-white/[.02]"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5">
                  <FileText className="size-[18px]" />
                </div>
                <button
                  onClick={() => setEditing(article)}
                  className="min-w-0 flex-1 text-left"
                >
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold">
                      {article.title}
                    </p>
                    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      {article.category}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-[10px] text-zinc-400">
                    {article.content}
                  </p>
                </button>
                <span className="hidden text-[9px] text-zinc-400 sm:block">
                  {relative(article.updatedAt)}
                </span>
                <button
                  aria-label="Hapus artikel"
                  onClick={() => {
                    if (window.confirm(`Hapus “${article.title}”?`))
                      remove.mutate(article.id)
                  }}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 sm:opacity-0 sm:group-hover:opacity-100 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))
          ) : (
            <Empty label="Artikel tidak ditemukan." />
          )}
        </div>
      </section>
      {editing && (
        <ArticleModal
          article={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ArticleModal({
  article,
  onClose,
}: {
  article: Article | null
  onClose: () => void
}) {
  const client = useQueryClient()
  const [title, setTitle] = useState(article?.title ?? "")
  const [category, setCategory] = useState(article?.category ?? "Umum")
  const [content, setContent] = useState(article?.content ?? "")
  const save = useMutation({
    mutationFn: () =>
      api("/api/kb", {
        method: article ? "PATCH" : "POST",
        body: JSON.stringify({ id: article?.id, title, category, content }),
      }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["kb"] })
      onClose()
    },
  })
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          save.mutate()
        }}
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-extrabold">
            {article ? "Edit artikel" : "Artikel baru"}
          </h2>
          <button type="button" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <label className="mt-6 block">
          <span className="text-[10px] font-bold">Judul pertanyaan</span>
          <input
            required
            minLength={3}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-[10px] font-bold">Kategori</span>
          <input
            required
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none dark:border-white/10"
          />
        </label>
        <label className="mt-4 block">
          <span className="text-[10px] font-bold">Jawaban</span>
          <textarea
            required
            minLength={3}
            rows={7}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-transparent p-3 text-xs leading-relaxed outline-none focus:border-emerald-400 dark:border-white/10"
          />
        </label>
        {save.error && (
          <p className="mt-3 text-sm text-red-500">{save.error.message}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            disabled={save.isPending}
            className="h-9 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {save.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  )
}

function TeamView() {
  const client = useQueryClient()
  const [form, setForm] = useState({ name: "", email: "", password: "" })
  const [createdName, setCreatedName] = useState("")
  const [resettingAgent, setResettingAgent] = useState<Agent | null>(null)
  const members = useQuery({
    queryKey: ["agents"],
    queryFn: () => api<{ data: Agent[] }>("/api/agents"),
  })
  const createAgent = useMutation({
    mutationFn: () =>
      api<{ data: Agent }>("/api/agents", {
        method: "POST",
        body: JSON.stringify(form),
      }),
    onSuccess: ({ data }) => {
      setCreatedName(data.name)
      setForm({ name: "", email: "", password: "" })
      void client.invalidateQueries({ queryKey: ["agents"] })
    },
  })

  return (
    <div className="mx-auto w-full max-w-[1180px] p-4 sm:p-7">
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">
          Kelola tim support
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Tambahkan agent yang dapat login dan menangani percakapan pelanggan.
        </p>
      </div>
      <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_360px]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/5">
            <div>
              <h3 className="text-sm font-bold">Anggota workspace</h3>
              <p className="mt-1 text-[10px] text-zinc-400">
                {members.data?.data.length ?? 0} akun aktif
              </p>
            </div>
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <UsersRound className="size-4" />
            </div>
          </div>
          {members.isLoading ? (
            <Loading />
          ) : members.error ? (
            <ErrorState error={members.error} />
          ) : members.data?.data.length ? (
            <div className="divide-y divide-zinc-100 dark:divide-white/5">
              {members.data.data.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <Avatar name={member.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold">{member.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-zinc-400">
                      {member.email ?? "Email tidak tersedia"}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[9px] font-bold",
                      member.role === "ADMIN"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    )}
                  >
                    {member.role === "ADMIN" ? "ADMIN" : "AGENT"}
                  </span>
                  {member.role === "AGENT" && (
                    <button
                      type="button"
                      aria-label={`Reset password ${member.name}`}
                      title="Reset password"
                      onClick={() => setResettingAgent(member)}
                      className="rounded-lg p-2 text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-300"
                    >
                      <KeyRound className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty label="Belum ada anggota tim." />
          )}
        </section>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            setCreatedName("")
            createAgent.mutate()
          }}
          className="h-fit rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50"
        >
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500 text-white">
            <UserPlus className="size-[18px]" />
          </div>
          <h3 className="mt-4 text-sm font-bold">Tambah agent</h3>
          <p className="mt-1 text-[10px] leading-5 text-zinc-400">
            Berikan password sementara secara langsung kepada anggota tim.
          </p>
          <label className="mt-5 block">
            <span className="text-[10px] font-bold">Nama lengkap</span>
            <input
              required
              minLength={2}
              maxLength={80}
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              placeholder="Nama agent"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-[10px] font-bold">Email</span>
            <input
              required
              type="email"
              maxLength={254}
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              placeholder="agent@bisnis.com"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
            />
          </label>
          <label className="mt-4 block">
            <span className="text-[10px] font-bold">Password sementara</span>
            <input
              required
              type="password"
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              placeholder="Minimal 8 karakter"
              className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
            />
          </label>
          {createdName && (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              Akun {createdName} berhasil dibuat.
            </p>
          )}
          {createAgent.error && (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {createAgent.error.message}
            </p>
          )}
          <button
            disabled={createAgent.isPending}
            className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {createAgent.isPending ? "Membuat akun..." : "Tambah agent"}
          </button>
        </form>
      </div>
      {resettingAgent && (
        <ResetAgentPasswordModal
          agent={resettingAgent}
          onClose={() => setResettingAgent(null)}
        />
      )}
    </div>
  )
}

function ResetAgentPasswordModal({
  agent,
  onClose,
}: {
  agent: Agent
  onClose: () => void
}) {
  const [password, setPassword] = useState("")
  const reset = useMutation({
    mutationFn: () =>
      api("/api/agents", {
        method: "PATCH",
        body: JSON.stringify({ userId: agent.id, password }),
      }),
    onSuccess: onClose,
  })

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault()
          reset.mutate()
        }}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <KeyRound className="size-[18px]" />
            </div>
            <h2 className="mt-4 font-heading text-lg font-extrabold">
              Reset password
            </h2>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Buat password sementara baru untuk {agent.name}. Semua sesi
              lamanya akan dikeluarkan.
            </p>
          </div>
          <button
            type="button"
            aria-label="Tutup"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            <X className="size-4" />
          </button>
        </div>
        <label className="mt-6 block">
          <span className="text-[10px] font-bold">Password sementara baru</span>
          <input
            required
            autoFocus
            type="password"
            minLength={8}
            maxLength={128}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimal 8 karakter"
            className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
          />
        </label>
        {reset.error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[10px] font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
            {reset.error.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
          >
            Batal
          </button>
          <button
            disabled={reset.isPending}
            className="h-9 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
          >
            {reset.isPending ? "Mereset..." : "Reset password"}
          </button>
        </div>
      </form>
    </div>
  )
}

function SettingsView() {
  const client = useQueryClient()
  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () =>
      api<{
        data: Setting | null
        runtime: { provider: string; model: string }
      }>("/api/settings"),
  })
  if (settings.isLoading) return <Loading />
  if (settings.error) return <ErrorState error={settings.error} />
  return (
    <div>
      <WorkspaceSettings />
      <SettingsForm
        key={settings.data?.data?.systemPrompt ?? "empty"}
        initial={settings.data?.data ?? null}
        runtime={settings.data?.runtime}
        onSaved={() =>
          void client.invalidateQueries({ queryKey: ["settings"] })
        }
      />
    </div>
  )
}

function WorkspaceSettings() {
  const client = useQueryClient()
  const workspace = useQuery({
    queryKey: ["workspace"],
    queryFn: () => api<{ data: WorkspaceSetting }>("/api/workspace"),
  })
  if (workspace.isLoading) return <Loading compact />
  if (workspace.error || !workspace.data)
    return <ErrorState error={workspace.error as Error} />
  return (
    <WorkspaceForm
      initial={workspace.data.data}
      onSaved={() => void client.invalidateQueries({ queryKey: ["workspace"] })}
    />
  )
}

function WorkspaceForm({
  initial,
  onSaved,
  onboarding = false,
}: {
  initial: WorkspaceSetting
  onSaved: () => void
  onboarding?: boolean
}) {
  const [form, setForm] = useState({
    name: initial.name,
    brandColor: initial.brandColor,
    welcomeMessage: initial.welcomeMessage,
    businessHours: initial.businessHours,
    addSamples: false,
  })
  const save = useMutation({
    mutationFn: () =>
      api("/api/workspace", {
        method: "PATCH",
        body: JSON.stringify({ ...form, completeOnboarding: onboarding }),
      }),
    onSuccess: onSaved,
  })
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
      className={cn(
        "mx-auto w-full max-w-[980px] p-4 sm:p-7",
        onboarding && "p-0"
      )}
    >
      {!onboarding && (
        <div className="mb-5">
          <h2 className="font-heading text-2xl font-extrabold">
            Profil workspace
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Identitas ini terlihat oleh customer di halaman chat.
          </p>
        </div>
      )}
      <section className="rounded-2xl border bg-white p-5 dark:bg-zinc-900/50">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Nama bisnis
            <input
              value={form.name}
              onChange={(event) =>
                setForm({ ...form, name: event.target.value })
              }
              maxLength={100}
              className="mt-2 h-10 w-full rounded-xl border bg-transparent px-3 font-normal"
            />
          </label>
          <label className="text-xs font-bold">
            Warna aksen
            <input
              value={form.brandColor}
              onChange={(event) =>
                setForm({ ...form, brandColor: event.target.value })
              }
              pattern="#[0-9A-Fa-f]{6}"
              className="mt-2 h-10 w-full rounded-xl border bg-transparent px-3 font-normal"
            />
          </label>
        </div>
        <label className="mt-4 block text-xs font-bold">
          Pesan sambutan
          <textarea
            value={form.welcomeMessage}
            onChange={(event) =>
              setForm({ ...form, welcomeMessage: event.target.value })
            }
            maxLength={500}
            className="mt-2 w-full rounded-xl border bg-transparent p-3 font-normal"
          />
        </label>
        <label className="mt-4 block text-xs font-bold">
          Jam operasional
          <input
            value={form.businessHours}
            onChange={(event) =>
              setForm({ ...form, businessHours: event.target.value })
            }
            maxLength={200}
            className="mt-2 h-10 w-full rounded-xl border bg-transparent px-3 font-normal"
          />
        </label>
        {onboarding && (
          <label className="mt-4 flex gap-2 text-xs">
            <input
              type="checkbox"
              checked={form.addSamples}
              onChange={(event) =>
                setForm({ ...form, addSamples: event.target.checked })
              }
            />{" "}
            Tambahkan tiga artikel knowledge base contoh
          </label>
        )}
        {save.error && (
          <p className="mt-3 text-xs text-red-500">{save.error.message}</p>
        )}
        <button
          disabled={save.isPending}
          className="mt-5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {save.isPending
            ? "Menyimpan..."
            : onboarding
              ? "Selesaikan setup"
              : "Simpan profil"}
        </button>
      </section>
    </form>
  )
}

function OnboardingWizard({
  initial,
  onComplete,
}: {
  initial: WorkspaceSetting
  onComplete: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-zinc-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-zinc-50 shadow-2xl dark:bg-zinc-950">
        <div className="p-6 pb-0">
          <p className="text-xs font-bold text-emerald-600">SETUP PERTAMA</p>
          <h2 className="mt-1 font-heading text-2xl font-extrabold">
            Siapkan workspace-mu
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            Atur identitas bisnis, lalu lanjutkan ke AI Settings untuk
            menyesuaikan tone jawaban. Link customer:{" "}
            <code className="rounded bg-zinc-200 px-1">/chat</code>
          </p>
        </div>
        <WorkspaceForm initial={initial} onboarding onSaved={onComplete} />
      </div>
    </div>
  )
}

function SettingsForm({
  initial,
  runtime,
  onSaved,
}: {
  initial: Setting | null
  runtime?: { provider: string; model: string }
  onSaved: () => void
}) {
  const [form, setForm] = useState<Setting>(
    initial ?? {
      systemPrompt:
        "Kamu adalah customer support yang ramah, ringkas, dan akurat.",
      temperature: 0.3,
      autoReply: true,
      maxHistory: 10,
    }
  )
  const [saved, setSaved] = useState(false)
  const save = useMutation({
    mutationFn: () =>
      api("/api/settings", { method: "PATCH", body: JSON.stringify(form) }),
    onSuccess: () => {
      setSaved(true)
      onSaved()
      setTimeout(() => setSaved(false), 2500)
    },
  })
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        save.mutate()
      }}
      className="mx-auto w-full max-w-[980px] p-4 sm:p-7"
    >
      <div>
        <h2 className="font-heading text-2xl font-extrabold tracking-tight">
          Bangun AI agent-mu
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Atur cara AI memahami bisnis dan berkomunikasi dengan pelanggan.
        </p>
      </div>
      {saved && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Check className="size-4" />
          Pengaturan berhasil disimpan.
        </div>
      )}
      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_270px]">
        <div className="space-y-5">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-900/50">
            <div className="flex items-start gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
                <Bot className="size-[18px]" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Instruksi utama</h3>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Menentukan kepribadian dan batasan AI.
                </p>
              </div>
            </div>
            <label className="mt-5 block">
              <span className="text-[10px] font-bold">System prompt</span>
              <textarea
                rows={8}
                value={form.systemPrompt}
                onChange={(event) =>
                  setForm({ ...form, systemPrompt: event.target.value })
                }
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
              />
              <span className="mt-1.5 block text-right text-[9px] text-zinc-400">
                {form.systemPrompt.length} / 10.000 karakter
              </span>
            </label>
          </section>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Automasi jawaban</h3>
                <p className="mt-1 text-[10px] text-zinc-400">
                  Izinkan AI membalas pelanggan secara otomatis.
                </p>
              </div>
              <button
                type="button"
                aria-label="Balas otomatis"
                onClick={() => setForm({ ...form, autoReply: !form.autoReply })}
                className={cn(
                  "relative h-6 w-11 rounded-full transition",
                  form.autoReply
                    ? "bg-emerald-500"
                    : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-4 rounded-full bg-white shadow transition-all",
                    form.autoReply ? "left-6" : "left-1"
                  )}
                />
              </button>
            </div>
            <div className="mt-5 border-t border-zinc-100 pt-5 dark:border-white/5">
              <div className="flex justify-between">
                <div>
                  <p className="text-[11px] font-semibold">Creativity</p>
                  <p className="mt-1 text-[9px] text-zinc-400">
                    Rendah lebih konsisten dan faktual.
                  </p>
                </div>
                <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold dark:bg-white/5">
                  {form.temperature.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={form.temperature}
                onChange={(event) =>
                  setForm({ ...form, temperature: Number(event.target.value) })
                }
                className="mt-4 w-full accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[8px] text-zinc-400">
                <span>Faktual</span>
                <span>Kreatif</span>
              </div>
            </div>
            <div className="mt-5 max-w-xs">
              <label className="text-[10px] font-bold">
                Riwayat pesan
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.maxHistory}
                  onChange={(event) =>
                    setForm({ ...form, maxHistory: Number(event.target.value) })
                  }
                  className="mt-2 h-9 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs font-normal dark:border-white/10"
                />
              </label>
            </div>
          </section>
          {save.error && (
            <p className="text-xs text-red-500">{save.error.message}</p>
          )}
          <button
            disabled={save.isPending || form.systemPrompt.length < 20}
            className="h-10 w-full rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-zinc-950"
          >
            {save.isPending ? "Menyimpan..." : "Simpan perubahan"}
          </button>
        </div>
        <aside className="space-y-4">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
            <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Model
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
              <div className="grid size-8 place-items-center rounded-lg bg-emerald-500 text-white">
                <Sparkles className="size-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">
                  {runtime?.model ?? "—"}
                </p>
                <p className="text-[9px] text-emerald-700 capitalize dark:text-emerald-300">
                  {runtime?.provider ?? "—"} · environment
                </p>
              </div>
              <Check className="ml-auto size-4 text-emerald-600" />
            </div>
            <p className="mt-3 text-center text-[9px] text-zinc-400">
              Model dikelola melalui environment.
            </p>
          </section>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
            <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Safety rules
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Jangan mengarang jawaban",
                "Eskalasi data sensitif",
                "Gunakan knowledge base",
              ].map((rule) => (
                <div key={rule} className="flex items-center gap-2 text-[10px]">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  {rule}
                </div>
              ))}
            </div>
          </section>
          <section className="rounded-2xl border border-violet-100 bg-violet-50 p-5 dark:border-violet-500/15 dark:bg-violet-500/10">
            <WandSparkles className="size-4 text-violet-600" />
            <p className="mt-3 text-[11px] font-bold">Live configuration</p>
            <p className="mt-1 text-[9px] leading-relaxed text-zinc-500">
              Perubahan langsung dipakai pada pesan customer berikutnya.
            </p>
          </section>
        </aside>
      </div>
    </form>
  )
}

function AnalyticsView() {
  const [range, setRange] = useState<"7d" | "30d">("7d")
  const analytics = useAnalytics(range, true)
  if (analytics.isLoading) return <Loading />
  if (analytics.error || !analytics.data)
    return <ErrorState error={analytics.error as Error} />
  const data = analytics.data.data
  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5 p-4 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Layanan yang makin pintar
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Metrik aktual dari Neon berdasarkan zona Asia/Jakarta.
          </p>
        </div>
        <select
          value={range}
          onChange={(event) => setRange(event.target.value as "7d" | "30d")}
          className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-bold dark:border-white/10 dark:bg-zinc-900"
        >
          <option value="7d">7 hari</option>
          <option value="30d">30 hari</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total conversations"
          value={data.totals.conversations}
          change="Aktual"
          icon={MessageCircle}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
        />
        <MetricCard
          label="AI resolution rate"
          value={`${data.totals.aiResolutionRate}%`}
          change="AI"
          icon={Bot}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10"
        />
        <MetricCard
          label="Average response"
          value={duration(data.totals.averageResponseMs)}
          change="Live"
          icon={Zap}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10"
          down
        />
        <MetricCard
          label="Escalations"
          value={data.totals.escalations}
          change="Admin"
          icon={CircleAlert}
          tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <h3 className="font-heading text-sm font-extrabold">
            Percakapan & resolusi
          </h3>
          <p className="mt-1 text-[10px] text-zinc-400">
            Tren performa selama periode aktif
          </p>
          <div className="mt-6">
            <VolumeChart data={data.volume} />
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <h3 className="font-heading text-sm font-extrabold">Top questions</h3>
          <p className="mt-1 text-[10px] text-zinc-400">
            Pertanyaan paling sering
          </p>
          <div className="mt-4 space-y-4">
            {data.topQuestions.length ? (
              data.topQuestions.map((item, index) => (
                <div key={item.question} className="flex gap-3">
                  <span className="grid size-7 shrink-0 place-items-center font-heading text-lg font-extrabold text-zinc-200 dark:text-white/10">
                    0{index + 1}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[11px] font-bold">
                    {item.question}
                  </p>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {item.count}×
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">Belum ada data.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

function useAnalytics(range: "7d" | "30d", enabled: boolean) {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => api<{ data: Analytics }>(`/api/analytics?range=${range}`),
    enabled,
    refetchInterval: 15_000,
  })
}
function VolumeChart({ data }: { data: Analytics["volume"] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="liveVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            opacity={0.25}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip />
          <Area
            type="monotone"
            dataKey="conversations"
            stroke="#10b981"
            fill="url(#liveVolume)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 ring-inset",
        status === "OPEN"
          ? "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-300"
          : status === "WAITING"
            ? "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300"
            : "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300"
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status === "WAITING"
        ? "MENUNGGU"
        : status === "RESOLVED"
          ? "SELESAI"
          : "TERBUKA"}
    </span>
  )
}
function Avatar({
  name,
  size = "md",
}: {
  name: string
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-violet-100 font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        size === "sm" && "size-8 text-[10px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-12 text-sm"
      )}
    >
      {initials(name)}
    </div>
  )
}
function Loading({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center text-zinc-400",
        compact ? "p-8" : "min-h-64"
      )}
    >
      <LoaderCircle className="size-6 animate-spin" />
    </div>
  )
}
function Empty({ label }: { label: string }) {
  return (
    <div className="grid min-h-44 place-items-center p-8 text-center text-sm text-zinc-500">
      <div>
        <Inbox className="mx-auto mb-3 size-7 opacity-50" />
        {label}
      </div>
    </div>
  )
}
function ErrorState({ error }: { error: Error }) {
  return (
    <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
      <p className="font-bold">Data gagal dimuat</p>
      <p className="mt-1">{error?.message ?? "Coba lagi beberapa saat."}</p>
    </div>
  )
}
function relative(value: string) {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 1000)
  )
  if (seconds < 60) return "baru"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}j`
  return `${Math.floor(seconds / 86400)}h`
}
function duration(ms: number) {
  if (!ms) return "—"
  if (ms < 60_000) return `${Math.round(ms / 1000)} dtk`
  return `${Math.round(ms / 60_000)} mnt`
}
function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  )
}
function jakartaToday() {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date())
}
