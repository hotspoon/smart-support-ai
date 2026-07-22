"use client"

import { useMemo, useState } from "react"
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
  CircleHelp,
  Clock3,
  FileText,
  Inbox,
  LayoutDashboard,
  Menu,
  MessageCircle,
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
  TrendingUp,
  Users,
  WandSparkles,
  X,
  Zap,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import {
  conversations as initialConversations,
  initialKnowledge,
  type Conversation,
  type ConversationStatus,
  weeklyData,
} from "@/components/support/mock-data"

type View = "dashboard" | "inbox" | "knowledge" | "analytics" | "settings"

const navItems = [
  { id: "dashboard" as const, label: "Overview", icon: LayoutDashboard },
  { id: "inbox" as const, label: "Inbox", icon: Inbox, count: 3 },
  { id: "knowledge" as const, label: "Knowledge", icon: BookOpen },
  { id: "analytics" as const, label: "Analytics", icon: BarChart3 },
]

const pageMeta: Record<
  View,
  { eyebrow: string; title: string; description: string }
> = {
  dashboard: {
    eyebrow: "Overview",
    title: "Selamat pagi, Faris",
    description: "Ini ringkasan performa customer support hari ini.",
  },
  inbox: {
    eyebrow: "Workspace",
    title: "Inbox",
    description: "Kelola semua percakapan pelanggan dalam satu tempat.",
  },
  knowledge: {
    eyebrow: "AI resources",
    title: "Knowledge base",
    description: "Kelola informasi yang digunakan AI untuk menjawab pelanggan.",
  },
  analytics: {
    eyebrow: "Insights",
    title: "Analytics",
    description: "Pantau kualitas layanan dan kontribusi AI support.",
  },
  settings: {
    eyebrow: "Workspace",
    title: "AI settings",
    description: "Atur perilaku, model, dan batas otomatisasi AI.",
  },
}

function LogoMark() {
  return (
    <div className="relative grid size-9 place-items-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
      <MessageCircle className="size-[19px] fill-white stroke-[2.4]" />
      <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white bg-amber-400 dark:border-zinc-950" />
    </div>
  )
}

function Avatar({
  conversation,
  size = "md",
}: {
  conversation: Conversation
  size?: "sm" | "md" | "lg"
}) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold",
        conversation.color,
        size === "sm" && "size-8 text-[10px]",
        size === "md" && "size-10 text-xs",
        size === "lg" && "size-12 text-sm"
      )}
    >
      {conversation.initials}
    </div>
  )
}

function StatusBadge({ status }: { status: ConversationStatus }) {
  const config = {
    OPEN: "bg-sky-50 text-sky-700 ring-sky-600/10 dark:bg-sky-500/10 dark:text-sky-300",
    WAITING:
      "bg-amber-50 text-amber-700 ring-amber-600/10 dark:bg-amber-500/10 dark:text-amber-300",
    RESOLVED:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/10 dark:bg-emerald-500/10 dark:text-emerald-300",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ring-1 ring-inset",
        config[status]
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

function AppSidebar({
  view,
  setView,
  open,
  setOpen,
}: {
  view: View
  setView: (view: View) => void
  open: boolean
  setOpen: (open: boolean) => void
}) {
  return (
    <>
      {open && (
        <button
          aria-label="Tutup menu"
          className="fixed inset-0 z-40 bg-zinc-950/35 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[252px] flex-col border-r border-zinc-200/70 bg-white px-4 py-5 transition-transform duration-300 lg:static lg:translate-x-0 dark:border-white/10 dark:bg-zinc-950",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-2">
          <LogoMark />
          <div>
            <p className="font-heading text-[17px] font-extrabold tracking-tight">
              SahutAja
            </p>
            <p className="text-[10px] font-semibold tracking-[.18em] text-zinc-400 uppercase">
              AI Support
            </p>
          </div>
          <button
            className="ml-auto rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 lg:hidden dark:hover:bg-white/5"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="mt-9 space-y-1" aria-label="Navigasi utama">
          <p className="mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-zinc-400 uppercase">
            Workspace
          </p>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setView(item.id)
                setOpen(false)
              }}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                view === item.id
                  ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "size-[18px]",
                  view === item.id && "stroke-[2.3]"
                )}
              />
              <span>{item.label}</span>
              {item.count && (
                <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {item.count}
                </span>
              )}
            </button>
          ))}
          <p className="mt-7 mb-2 px-3 text-[10px] font-bold tracking-[.16em] text-zinc-400 uppercase">
            Manage
          </p>
          <button
            onClick={() => {
              setView("settings")
              setOpen(false)
            }}
            className={cn(
              "flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
              view === "settings"
                ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white"
            )}
          >
            <Settings className="size-[18px]" /> AI settings
          </button>
        </nav>

        <div className="mt-auto">
          <div className="mb-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50/50 p-4 dark:border-emerald-500/15 dark:from-emerald-500/10 dark:to-transparent">
            <div className="mb-3 flex items-center justify-between">
              <Sparkles className="size-4 text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                82% AUTOMATED
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-white/10">
              <div className="h-full w-[82%] rounded-full bg-emerald-500" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              AI menyelesaikan 96 percakapan hari ini.
            </p>
          </div>
          <button className="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-zinc-50 dark:hover:bg-white/5">
            <div className="grid size-9 place-items-center rounded-full bg-zinc-900 text-xs font-bold text-white dark:bg-white dark:text-zinc-900">
              FA
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">Faris Admin</p>
              <p className="truncate text-[10px] text-zinc-400">
                Administrator
              </p>
            </div>
            <MoreHorizontal className="ml-auto size-4 text-zinc-400" />
          </button>
        </div>
      </aside>
    </>
  )
}

function Header({ view, onMenu }: { view: View; onMenu: () => void }) {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <header className="flex h-[72px] shrink-0 items-center border-b border-zinc-200/70 bg-white/85 px-4 backdrop-blur-xl sm:px-7 dark:border-white/10 dark:bg-zinc-950/80">
      <button
        onClick={onMenu}
        className="mr-3 rounded-xl p-2 text-zinc-500 hover:bg-zinc-100 lg:hidden dark:hover:bg-white/5"
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
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="hidden h-9 items-center gap-2 rounded-xl border border-zinc-200 px-3 text-xs font-medium text-zinc-500 hover:bg-zinc-50 sm:flex dark:border-white/10 dark:hover:bg-white/5"
        >
          <span className="size-2 rounded-full bg-emerald-500" />
          Tema
          <ChevronDown className="size-3" />
        </button>
        <button className="relative grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5">
          <Bell className="size-4" />
          <span className="absolute top-2 right-2 size-1.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-950" />
        </button>
        <button className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-500 hover:bg-zinc-50 dark:border-white/10 dark:hover:bg-white/5">
          <CircleHelp className="size-4" />
        </button>
      </div>
    </header>
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
  value: string
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
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold",
            down
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          )}
        >
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

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid rgba(120,120,120,.18)",
  fontSize: 11,
  boxShadow: "0 12px 30px rgba(0,0,0,.08)",
}

function DashboardView({ onOpenInbox }: { onOpenInbox: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-4 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight sm:text-[28px]">
            Selamat pagi, Faris{" "}
            <span className="inline-block origin-bottom-right motion-safe:animate-[wiggle_1s_ease-in-out_1]">
              👋
            </span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Berikut performa support kamu hari ini, 21 Juli 2026.
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
        <MetricCard
          label="Percakapan hari ini"
          value="120"
          change="12.5%"
          icon={MessageCircle}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
        />
        <MetricCard
          label="Diselesaikan AI"
          value="96"
          change="8.2%"
          icon={Sparkles}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
        />
        <MetricCard
          label="Menunggu balasan"
          value="24"
          change="4.1%"
          icon={Clock3}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
          down
        />
        <MetricCard
          label="Rata-rata respons"
          value="2.8s"
          change="0.6s"
          icon={Zap}
          tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
          down
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,.75fr)]">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h3 className="font-heading text-base font-extrabold">
                Volume percakapan
              </h3>
              <p className="mt-1 text-xs text-zinc-400">7 hari terakhir</p>
            </div>
            <button className="flex items-center gap-2 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-500 dark:border-white/10">
              Mingguan <ChevronDown className="size-3" />
            </button>
          </div>
          <div className="h-[244px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyData}
                margin={{ top: 5, right: 2, bottom: 0, left: -28 }}
              >
                <defs>
                  <linearGradient id="greenArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  className="text-zinc-100 dark:text-white/5"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="conversations"
                  name="Percakapan"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fill="url(#greenArea)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
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
              82%
            </span>
            <span className="mb-1.5 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
              +6.4%
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">
            96 dari 120 percakapan selesai tanpa eskalasi admin.
          </p>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-300" />
          </div>
          <div className="mt-5 grid grid-cols-2 divide-x divide-white/10">
            <div>
              <p className="text-[10px] text-zinc-500">CSAT</p>
              <p className="mt-1 text-lg font-bold">
                4.8<span className="text-xs text-zinc-500">/5</span>
              </p>
            </div>
            <div className="pl-5">
              <p className="text-[10px] text-zinc-500">Escalation</p>
              <p className="mt-1 text-lg font-bold">18%</p>
            </div>
          </div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 dark:border-white/5">
            <div>
              <h3 className="font-heading text-sm font-extrabold">
                Percakapan terbaru
              </h3>
              <p className="mt-0.5 text-[10px] text-zinc-400">
                Aktivitas terbaru dari semua channel
              </p>
            </div>
            <button
              onClick={onOpenInbox}
              className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
            >
              Lihat semua →
            </button>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-white/5">
            {initialConversations.slice(0, 4).map((conversation) => (
              <button
                onClick={onOpenInbox}
                key={conversation.id}
                className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-zinc-50/80 dark:hover:bg-white/[.025]"
              >
                <Avatar conversation={conversation} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-xs font-bold">
                      {conversation.customer}
                    </p>
                    <span className="text-[9px] text-zinc-400">
                      {conversation.channel}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-[11px] text-zinc-400">
                    {conversation.preview}
                  </p>
                </div>
                <div className="hidden sm:block">
                  <StatusBadge status={conversation.status} />
                </div>
                <span className="w-7 text-right text-[10px] text-zinc-400">
                  {conversation.time}
                </span>
              </button>
            ))}
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-sm font-extrabold">
                Topik teratas
              </h3>
              <p className="mt-0.5 text-[10px] text-zinc-400">Hari ini</p>
            </div>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <div className="mt-5 space-y-4">
            {[
              ["Refund & pembayaran", 38, "bg-emerald-500"],
              ["Status pengiriman", 29, "bg-violet-500"],
              ["Akun & keamanan", 18, "bg-amber-500"],
              ["Promo & voucher", 15, "bg-sky-500"],
            ].map(([label, value, color]) => (
              <div key={String(label)}>
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="font-medium">{label}</span>
                  <span className="font-bold text-zinc-400">{value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-white/5">
                  <div
                    className={cn("h-full rounded-full", color)}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function InboxView() {
  const [items, setItems] = useState(initialConversations)
  const [selectedId, setSelectedId] = useState(initialConversations[0].id)
  const [filter, setFilter] = useState<"ALL" | ConversationStatus>("ALL")
  const [query, setQuery] = useState("")
  const [message, setMessage] = useState("")
  const [showDetail, setShowDetail] = useState(false)
  const selected = items.find((item) => item.id === selectedId) ?? items[0]
  const filtered = items.filter(
    (item) =>
      (filter === "ALL" || item.status === filter) &&
      (item.customer.toLowerCase().includes(query.toLowerCase()) ||
        item.preview.toLowerCase().includes(query.toLowerCase()))
  )

  function sendMessage() {
    if (!message.trim()) return
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id
          ? {
              ...item,
              status: "WAITING",
              preview: message.trim(),
              messages: [
                ...item.messages,
                {
                  id: crypto.randomUUID(),
                  sender: "ADMIN",
                  content: message.trim(),
                  time: new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                },
              ],
            }
          : item
      )
    )
    setMessage("")
  }
  function updateStatus(status: ConversationStatus) {
    setItems((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, status } : item
      )
    )
  }

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
                3 membutuhkan perhatian
              </p>
            </div>
            <button className="grid size-9 place-items-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600">
              <PenLine className="size-4" />
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari percakapan..."
              className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <div className="mt-3 flex gap-1 overflow-x-auto">
            {(["ALL", "OPEN", "WAITING", "RESOLVED"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[10px] font-bold whitespace-nowrap",
                  filter === value
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950"
                    : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                )}
              >
                {value === "ALL"
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
          {filtered.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => {
                setSelectedId(conversation.id)
                setShowDetail(true)
              }}
              className={cn(
                "relative flex w-full gap-3 border-b border-zinc-100 p-4 text-left transition dark:border-white/5",
                selected.id === conversation.id
                  ? "bg-emerald-50/65 dark:bg-emerald-500/[.07]"
                  : "hover:bg-zinc-50 dark:hover:bg-white/[.025]"
              )}
            >
              {selected.id === conversation.id && (
                <span className="absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-emerald-500" />
              )}
              <Avatar conversation={conversation} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <p className="truncate text-xs font-bold">
                    {conversation.customer}
                  </p>
                  <span className="ml-auto text-[10px] text-zinc-400">
                    {conversation.time}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-1.5 truncate text-[11px]",
                    conversation.unread
                      ? "font-semibold text-zinc-700 dark:text-zinc-200"
                      : "text-zinc-400"
                  )}
                >
                  {conversation.preview}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      conversation.status === "OPEN"
                        ? "bg-sky-500"
                        : conversation.status === "WAITING"
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                    )}
                  />
                  <span className="text-[9px] font-semibold text-zinc-400">
                    {conversation.channel}
                  </span>
                  {conversation.unread > 0 && (
                    <span className="ml-auto grid size-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">
                      {conversation.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="grid place-items-center p-10 text-center">
              <Search className="size-7 text-zinc-300" />
              <p className="mt-3 text-xs font-semibold">
                Percakapan tidak ditemukan
              </p>
            </div>
          )}
        </div>
      </section>

      <section
        className={cn(
          "min-w-0 flex-1 flex-col",
          showDetail ? "flex" : "hidden md:flex"
        )}
      >
        <div className="flex h-[70px] shrink-0 items-center gap-3 border-b border-zinc-200/70 px-4 sm:px-5 dark:border-white/10">
          <button
            onClick={() => setShowDetail(false)}
            className="rounded-lg p-2 text-zinc-400 md:hidden"
          >
            <SidebarClose className="size-5" />
          </button>
          <Avatar conversation={selected} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-xs font-bold">{selected.customer}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-400">
              <span className="size-1.5 rounded-full bg-emerald-500" /> Online ·{" "}
              {selected.channel}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selected.status}
              onChange={(event) =>
                updateStatus(event.target.value as ConversationStatus)
              }
              className="h-9 rounded-xl border border-zinc-200 bg-transparent px-2 text-[10px] font-bold outline-none dark:border-white/10"
            >
              <option value="OPEN">Terbuka</option>
              <option value="WAITING">Menunggu</option>
              <option value="RESOLVED">Selesai</option>
            </select>
            <button className="grid size-9 place-items-center rounded-xl border border-zinc-200 text-zinc-400 dark:border-white/10">
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto bg-zinc-50/60 px-4 py-6 sm:px-8 dark:bg-black/10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-3 text-[10px] text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
              Hari ini
              <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
            </div>
            <div className="space-y-5">
              {selected.messages.map((item) => {
                const own = item.sender !== "USER"
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-end gap-2.5",
                      own && "flex-row-reverse"
                    )}
                  >
                    <div
                      className={cn(
                        "grid size-7 shrink-0 place-items-center rounded-full text-[9px] font-bold",
                        item.sender === "USER"
                          ? selected.color
                          : item.sender === "AI"
                            ? "bg-emerald-500 text-white"
                            : "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                      )}
                    >
                      {item.sender === "USER" ? (
                        selected.initials
                      ) : item.sender === "AI" ? (
                        <Bot className="size-3.5" />
                      ) : (
                        "FA"
                      )}
                    </div>
                    <div
                      className={cn(
                        "max-w-[82%] sm:max-w-[70%]",
                        own && "text-right"
                      )}
                    >
                      <div
                        className={cn(
                          "inline-block rounded-2xl px-4 py-3 text-left text-xs leading-relaxed shadow-sm",
                          item.sender === "USER"
                            ? "rounded-bl-md border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900"
                            : item.sender === "AI"
                              ? "rounded-br-md bg-emerald-500 text-white"
                              : "rounded-br-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        )}
                      >
                        <p>{item.content}</p>
                        {item.sender === "AI" && (
                          <div className="mt-2 flex items-center gap-1 border-t border-white/20 pt-2 text-[9px] text-emerald-50">
                            <Sparkles className="size-3" /> Dijawab dari
                            knowledge base
                          </div>
                        )}
                      </div>
                      <p className="mt-1 px-1 text-[9px] text-zinc-400">
                        {item.time} {own && "· Terkirim"}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-zinc-200/70 bg-white p-3 sm:p-4 dark:border-white/10 dark:bg-zinc-950">
          <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 p-2 shadow-sm focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault()
                  sendMessage()
                }
              }}
              rows={2}
              placeholder="Tulis balasan..."
              className="block w-full resize-none bg-transparent px-2 py-1 text-xs leading-relaxed outline-none placeholder:text-zinc-400"
            />
            <div className="mt-1 flex items-center">
              <button className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/10">
                <Paperclip className="size-4" />
              </button>
              <button className="flex items-center gap-1.5 rounded-lg p-2 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                <WandSparkles className="size-4" />
                AI suggest
              </button>
              <button
                onClick={sendMessage}
                disabled={!message.trim()}
                className="ml-auto grid size-8 place-items-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40"
              >
                <Send className="size-3.5" />
              </button>
            </div>
          </div>
          <p className="mt-2 text-center text-[9px] text-zinc-400">
            Tekan Enter untuk mengirim · Shift + Enter untuk baris baru
          </p>
        </div>
      </section>
      <aside className="hidden w-[270px] shrink-0 border-l border-zinc-200/70 p-5 2xl:block dark:border-white/10">
        <div className="text-center">
          <div className="flex justify-center">
            <Avatar conversation={selected} size="lg" />
          </div>
          <p className="mt-3 text-sm font-bold">{selected.customer}</p>
          <p className="mt-1 text-[10px] text-zinc-400">{selected.email}</p>
        </div>
        <div className="mt-6 space-y-5 border-t border-zinc-100 pt-5 dark:border-white/5">
          <div>
            <p className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
              Customer details
            </p>
            <div className="mt-3 space-y-3 text-[11px]">
              <div className="flex justify-between">
                <span className="text-zinc-400">Channel</span>
                <span className="font-semibold">{selected.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Percakapan</span>
                <span className="font-semibold">4</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Customer since</span>
                <span className="font-semibold">12 Mei 2026</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-bold tracking-wider text-zinc-400 uppercase">
              Tags
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {selected.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-lg bg-zinc-100 px-2 py-1 text-[9px] font-semibold dark:bg-white/5"
                >
                  {tag}
                </span>
              ))}
              <button className="grid size-6 place-items-center rounded-lg border border-dashed border-zinc-300 text-zinc-400 dark:border-white/15">
                <Plus className="size-3" />
              </button>
            </div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
            <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              <Sparkles className="size-3.5" />
              AI summary
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-zinc-500 dark:text-zinc-400">
              Pelanggan meminta refund karena produk tidak sesuai pesanan.
            </p>
          </div>
        </div>
      </aside>
    </div>
  )
}

function KnowledgeView() {
  const [items, setItems] = useState(initialKnowledge)
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<
    (typeof initialKnowledge)[number] | null
  >(null)
  const filtered = items.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  )
  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const payload = {
      id: editing?.id ?? crypto.randomUUID(),
      title: String(form.get("title")),
      category: String(form.get("category")),
      content: String(form.get("content")),
      updated: "Baru saja",
    }
    setItems((current) =>
      editing && current.some((item) => item.id === editing.id)
        ? current.map((item) => (item.id === editing.id ? payload : item))
        : [payload, ...current]
    )
    setEditing(null)
  }
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
          onClick={() =>
            setEditing({
              id: "",
              title: "",
              category: "Umum",
              content: "",
              updated: "",
            })
          }
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
            {items.length}
          </p>
          <p className="mt-1 text-xs text-zinc-400">Artikel pengetahuan</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
              <CheckCircle2 className="size-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              +4.2%
            </span>
          </div>
          <p className="mt-4 font-heading text-2xl font-extrabold">94%</p>
          <p className="mt-1 text-xs text-zinc-400">Answer coverage</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div className="flex items-center justify-between">
            <div className="grid size-9 place-items-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10">
              <Activity className="size-4" />
            </div>
            <span className="text-[10px] text-zinc-400">7 hari</span>
          </div>
          <p className="mt-4 font-heading text-2xl font-extrabold">386</p>
          <p className="mt-1 text-xs text-zinc-400">Jawaban menggunakan KB</p>
        </div>
      </div>
      <section className="mt-5 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900/50">
        <div className="flex flex-col gap-3 border-b border-zinc-100 p-4 sm:flex-row sm:items-center dark:border-white/5">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari artikel..."
              className="h-9 w-full rounded-xl border border-zinc-200 bg-zinc-50 pr-3 pl-9 text-xs outline-none focus:border-emerald-400 dark:border-white/10 dark:bg-white/5"
            />
          </div>
          <span className="text-[10px] font-medium text-zinc-400 sm:ml-auto">
            {filtered.length} artikel
          </span>
        </div>
        <div className="divide-y divide-zinc-100 dark:divide-white/5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group flex items-start gap-3 p-4 hover:bg-zinc-50/60 sm:items-center sm:px-5 dark:hover:bg-white/[.02]"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5">
                <FileText className="size-[18px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xs font-bold">{item.title}</p>
                  <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    {item.category}
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-[10px] text-zinc-400">
                  {item.content}
                </p>
              </div>
              <span className="hidden text-[9px] text-zinc-400 sm:block">
                {item.updated}
              </span>
              <div className="flex gap-1 sm:opacity-0 sm:group-hover:opacity-100">
                <button
                  onClick={() => setEditing(item)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  <PenLine className="size-3.5" />
                </button>
                <button
                  onClick={() =>
                    setItems((current) =>
                      current.filter((entry) => entry.id !== item.id)
                    )
                  }
                  className="rounded-lg p-2 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      {editing && (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/45 p-4 backdrop-blur-sm">
          <form
            onSubmit={save}
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-heading text-lg font-extrabold">
                  {editing.id ? "Edit artikel" : "Artikel baru"}
                </h3>
                <p className="mt-1 text-[11px] text-zinc-400">
                  AI akan langsung menggunakan informasi ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold">Judul pertanyaan</span>
                <input
                  name="title"
                  required
                  defaultValue={editing.title}
                  placeholder="Contoh: Bagaimana cara refund?"
                  className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none focus:border-emerald-400 dark:border-white/10"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold">Kategori</span>
                <select
                  name="category"
                  defaultValue={editing.category}
                  className="mt-2 h-10 w-full rounded-xl border border-zinc-200 bg-transparent px-3 text-xs outline-none dark:border-white/10"
                >
                  <option>Umum</option>
                  <option>Pembayaran</option>
                  <option>Pengiriman</option>
                  <option>Akun</option>
                  <option>Promo</option>
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold">Jawaban</span>
                <textarea
                  name="content"
                  required
                  defaultValue={editing.content}
                  rows={5}
                  placeholder="Tulis jawaban yang lengkap dan akurat..."
                  className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-transparent p-3 text-xs leading-relaxed outline-none focus:border-emerald-400 dark:border-white/10"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="h-9 rounded-xl px-4 text-xs font-bold text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/5"
              >
                Batal
              </button>
              <button className="h-9 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white hover:bg-emerald-600">
                Simpan artikel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function AnalyticsView() {
  const topics = [
    { name: "Refund", value: 38, color: "#10b981" },
    { name: "Pengiriman", value: 29, color: "#8b5cf6" },
    { name: "Akun", value: 18, color: "#f59e0b" },
    { name: "Promo", value: 15, color: "#38bdf8" },
  ]
  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-5 p-4 sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-extrabold tracking-tight">
            Layanan yang makin pintar
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Data 15–21 Juli 2026 dibanding periode sebelumnya.
          </p>
        </div>
        <button className="flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 text-[10px] font-bold dark:border-white/10">
          7 hari terakhir <ChevronDown className="size-3" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total conversations"
          value="626"
          change="14.2%"
          icon={MessageCircle}
          tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
        />
        <MetricCard
          label="AI resolution rate"
          value="82%"
          change="6.4%"
          icon={Bot}
          tone="bg-violet-50 text-violet-600 dark:bg-violet-500/10"
        />
        <MetricCard
          label="Average response"
          value="2.8s"
          change="0.6s"
          icon={Zap}
          tone="bg-amber-50 text-amber-600 dark:bg-amber-500/10"
          down
        />
        <MetricCard
          label="Customer satisfaction"
          value="4.8"
          change="0.2"
          icon={Users}
          tone="bg-sky-50 text-sky-600 dark:bg-sky-500/10"
        />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.45fr_.75fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <div>
            <h3 className="font-heading text-sm font-extrabold">
              Percakapan & resolusi
            </h3>
            <p className="mt-1 text-[10px] text-zinc-400">
              Tren performa selama seminggu
            </p>
          </div>
          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={4} margin={{ left: -28 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="currentColor"
                  className="text-zinc-100 dark:text-white/5"
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a1a1aa", fontSize: 10 }}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar
                  dataKey="conversations"
                  name="Percakapan"
                  fill="#d4d4d8"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="resolved"
                  name="AI resolved"
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
          <h3 className="font-heading text-sm font-extrabold">
            Kategori pertanyaan
          </h3>
          <p className="mt-1 text-[10px] text-zinc-400">
            Distribusi minggu ini
          </p>
          <div className="relative mt-4 h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topics}
                  dataKey="value"
                  innerRadius={54}
                  outerRadius={75}
                  paddingAngle={4}
                  stroke="none"
                >
                  {topics.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="font-heading text-xl font-extrabold">626</p>
                <p className="text-[8px] tracking-wider text-zinc-400 uppercase">
                  Total
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {topics.map((topic) => (
              <div
                key={topic.name}
                className="flex items-center gap-2 text-[10px]"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: topic.color }}
                />
                <span className="text-zinc-500">{topic.name}</span>
                <span className="ml-auto font-bold">{topic.value}%</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900/50">
        <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/5">
          <h3 className="font-heading text-sm font-extrabold">
            Pertanyaan paling sering
          </h3>
        </div>
        <div className="grid gap-px bg-zinc-100 md:grid-cols-3 dark:bg-white/5">
          {[
            ["Bagaimana cara refund?", "84 pertanyaan", "91% selesai AI"],
            ["Di mana pesanan saya?", "68 pertanyaan", "86% selesai AI"],
            ["Bagaimana pakai voucher?", "42 pertanyaan", "95% selesai AI"],
          ].map((item, index) => (
            <div key={item[0]} className="bg-white p-5 dark:bg-zinc-900">
              <div className="flex items-center gap-3">
                <span className="font-heading text-xl font-extrabold text-zinc-200 dark:text-white/10">
                  0{index + 1}
                </span>
                <p className="text-xs font-bold">{item[0]}</p>
              </div>
              <div className="mt-4 flex justify-between text-[10px] text-zinc-400">
                <span>{item[1]}</span>
                <span className="font-semibold text-emerald-600">
                  {item[2]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SettingsView() {
  const [saved, setSaved] = useState(false)
  const [temperature, setTemperature] = useState(30)
  const [automation, setAutomation] = useState(true)
  return (
    <div className="mx-auto w-full max-w-[980px] p-4 sm:p-7">
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
                defaultValue="Kamu adalah customer support SahutAja yang ramah, ringkas, dan solutif. Jawab hanya berdasarkan knowledge base yang tersedia. Jika informasi tidak cukup atau pelanggan meminta tindakan pada akun, eskalasikan ke admin. Gunakan Bahasa Indonesia yang natural."
                rows={8}
                className="mt-2 w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs leading-relaxed outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
              />
              <span className="mt-1.5 block text-right text-[9px] text-zinc-400">
                328 / 2,000 karakter
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
                onClick={() => setAutomation(!automation)}
                className={cn(
                  "relative h-6 w-11 rounded-full transition",
                  automation ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 size-4 rounded-full bg-white shadow transition-all",
                    automation ? "left-6" : "left-1"
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
                  {(temperature / 100).toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={temperature}
                onChange={(event) => setTemperature(Number(event.target.value))}
                className="mt-4 w-full accent-emerald-500"
              />
              <div className="mt-1 flex justify-between text-[8px] text-zinc-400">
                <span>Faktual</span>
                <span>Kreatif</span>
              </div>
            </div>
          </section>
          <button
            onClick={() => {
              setSaved(true)
              window.setTimeout(() => setSaved(false), 2500)
            }}
            className="h-10 w-full rounded-xl bg-zinc-950 text-xs font-bold text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-950"
          >
            Simpan perubahan
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
              <div>
                <p className="text-[11px] font-bold">Llama 3.3 70B</p>
                <p className="text-[9px] text-emerald-700 dark:text-emerald-300">
                  Groq · Free tier
                </p>
              </div>
              <Check className="ml-auto size-4 text-emerald-600" />
            </div>
            <button className="mt-3 w-full text-center text-[10px] font-bold text-zinc-400 hover:text-zinc-700">
              Ganti model
            </button>
          </section>
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-white/10 dark:bg-zinc-900/50">
            <p className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
              Safety rules
            </p>
            <div className="mt-4 space-y-3">
              {[
                "Jangan mengarang jawaban",
                "Eskalasi data sensitif",
                "Maks. 3 kali percobaan",
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
            <p className="mt-3 text-[11px] font-bold">Test your AI</p>
            <p className="mt-1 text-[9px] leading-relaxed text-zinc-500">
              Coba pertanyaan pelanggan sebelum menerapkan pengaturan.
            </p>
            <button className="mt-4 h-8 w-full rounded-lg bg-white text-[10px] font-bold text-violet-700 shadow-sm dark:bg-white/10 dark:text-violet-300">
              Buka playground
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}

export function SupportDesk() {
  const [view, setView] = useState<View>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const content = useMemo(() => {
    if (view === "dashboard")
      return <DashboardView onOpenInbox={() => setView("inbox")} />
    if (view === "inbox") return <InboxView />
    if (view === "knowledge") return <KnowledgeView />
    if (view === "analytics") return <AnalyticsView />
    return <SettingsView />
  }, [view])
  return (
    <div className="flex h-svh min-h-[600px] overflow-hidden bg-zinc-50 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <AppSidebar
        view={view}
        setView={setView}
        open={sidebarOpen}
        setOpen={setSidebarOpen}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header view={view} onMenu={() => setSidebarOpen(true)} />
        <main className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-y-auto">
          {content}
        </main>
      </div>
    </div>
  )
}
