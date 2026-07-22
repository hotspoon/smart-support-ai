import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpen,
  CircleCheck,
  Clock3,
  Inbox,
  MessageCircle,
  MessagesSquare,
  Sparkles,
  UserRoundCheck,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const features = [
  {
    icon: MessagesSquare,
    title: "Jawaban cepat",
    copy: "Pertanyaan rutin dijawab dari informasi bisnismu.",
  },
  {
    icon: Inbox,
    title: "Inbox terpusat",
    copy: "Semua percakapan dan statusnya tersimpan rapi.",
  },
  {
    icon: BookOpen,
    title: "Mudah diajari",
    copy: "Tambahkan informasi yang perlu diketahui SahutAja.",
  },
  {
    icon: BellRing,
    title: "Tidak ada yang terlewat",
    copy: "Tim tahu saat pelanggan terlalu lama menunggu.",
  },
  {
    icon: UserRoundCheck,
    title: "Bisa diambil alih",
    copy: "Admin masuk saat percakapan perlu sentuhan manusia.",
  },
  {
    icon: BarChart3,
    title: "Hasil terlihat",
    copy: "Pantau percakapan, respons, dan penilaian pelanggan.",
  },
]

const steps = [
  ["01", "Isi informasi bisnis"],
  ["02", "Bagikan halaman chat"],
  ["03", "Pantau dari inbox"],
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7faf7] text-[#10251b]">
      <header className="relative z-20 border-b border-emerald-950/8 bg-[#f7faf7]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="SahutAja — halaman utama">
            <Image
              src="/sahutaja_logo.png"
              alt="SahutAja"
              width={352}
              height={192}
              priority
              className="h-auto w-36 object-contain object-left sm:w-40"
            />
          </Link>
          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-emerald-950/65 md:flex"
            aria-label="Navigasi utama"
          >
            <a href="#fitur" className="transition hover:text-emerald-700">
              Fitur
            </a>
            <a href="#cara-kerja" className="transition hover:text-emerald-700">
              Cara kerja
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-950/5 sm:inline-flex"
            >
              Masuk
            </Link>
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full bg-[#0c6b42] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#075c38]"
            >
              Coba chat <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(circle_at_15%_15%,rgba(132,204,22,.16),transparent_35%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,.14),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[.9fr_1.1fr] lg:py-28">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3 py-1.5 text-xs font-bold text-emerald-800 shadow-sm backdrop-blur">
              <span className="size-2 rounded-full bg-lime-500" />
              Customer service yang lebih sigap
            </div>
            <h1 className="mt-7 font-heading text-5xl leading-[.98] font-extrabold tracking-[-.055em] text-balance sm:text-6xl lg:text-[72px]">
              Pesan pelanggan?
              <span className="mt-2 block text-[#0c6b42]">Sahut aja.</span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-8 text-emerald-950/65 sm:text-lg">
              Jawab pertanyaan rutin, rapikan percakapan, dan libatkan tim saat
              dibutuhkan.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0c6b42] px-6 py-4 text-sm font-extrabold text-white shadow-xl shadow-emerald-900/15 transition hover:-translate-y-0.5 hover:bg-[#075c38]"
              >
                Coba SahutAja <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-emerald-950/12 bg-white/70 px-6 py-4 text-sm font-extrabold text-emerald-950 transition hover:bg-white"
              >
                Buka dashboard
              </Link>
            </div>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section className="border-y border-emerald-950/8 bg-white/65">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 px-5 py-7 sm:px-8">
          {["Toko online", "Jasa", "Kursus", "Tim support"].map((item) => (
            <span
              key={item}
              className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-900"
            >
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-emerald-700 uppercase">
              Yang kamu dapat
            </p>
            <h2 className="mt-4 font-heading text-4xl leading-tight font-extrabold tracking-[-.04em] sm:text-5xl">
              Lebih cepat, tetap terasa manusia.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, copy }) => (
              <article
                key={title}
                className="rounded-3xl border border-emerald-950/8 bg-white p-6 shadow-[0_16px_60px_rgba(6,78,48,.06)]"
              >
                <div className="grid size-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 font-heading text-lg font-extrabold tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-emerald-950/55">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="bg-[#0d2e21] text-white">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
          <p className="text-xs font-extrabold tracking-[.18em] text-lime-400 uppercase">
            Mulai tanpa ribet
          </p>
          <h2 className="mt-4 max-w-2xl font-heading text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">
            Tiga langkah. Langsung jalan.
          </h2>
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map(([number, title]) => (
              <article
                key={number}
                className="rounded-3xl border border-white/10 bg-white/[.045] p-7"
              >
                <span className="font-mono text-sm font-bold text-lime-400">
                  {number}
                </span>
                <h3 className="mt-10 font-heading text-xl font-extrabold">
                  {title}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-extrabold tracking-[.18em] text-emerald-700 uppercase">
              Tahu batas
            </p>
            <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-[-.04em] sm:text-5xl">
              Kalau belum tahu, timmu yang lanjut.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-emerald-950/60">
              SahutAja meneruskan percakapan saat informasi belum cukup.
            </p>
          </div>
          <div className="rounded-[32px] border border-emerald-950/8 bg-[#edf7ef] p-5 sm:p-8">
            <div className="rounded-3xl bg-white p-5 shadow-xl shadow-emerald-950/8">
              <div className="flex items-center gap-3 border-b border-emerald-950/8 pb-4">
                <div className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <MessageCircle className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-extrabold">Percakapan baru</p>
                  <p className="text-xs text-emerald-950/45">Dita · baru saja</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-6">
                <p className="ml-auto max-w-[84%] rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-white">
                  Bisa ubah alamat pesanan?
                </p>
                <p className="max-w-[88%] rounded-2xl rounded-bl-md bg-emerald-50 px-4 py-3 text-emerald-950">
                  Pesanmu sudah diteruskan ke tim support, ya.
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800">
                  <Clock3 className="size-4" /> Menunggu admin
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[36px] bg-[#a8e063] px-6 py-14 sm:px-12 sm:py-16">
          <div className="absolute -top-24 -right-16 size-72 rounded-full border-[48px] border-white/20" />
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="max-w-2xl font-heading text-4xl leading-tight font-extrabold tracking-[-.045em] text-emerald-950 sm:text-5xl">
              Coba satu pesan. Lihat sendiri hasilnya.
            </h2>
            <Link
              href="/chat"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-6 py-4 text-sm font-extrabold text-white transition hover:-translate-y-0.5"
            >
              Buka demo chat <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-emerald-950/8 bg-white/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-heading text-lg font-extrabold">SahutAja</p>
            <p className="mt-1 text-xs text-emerald-950/50">
              Setiap pelanggan pasti tersahut.
            </p>
          </div>
          <p className="text-xs text-emerald-950/40">© 2026 SahutAja</p>
        </div>
      </footer>
    </main>
  )
}

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="absolute -inset-5 -z-10 rotate-2 rounded-[40px] bg-lime-300/35 blur-sm" />
      <div className="overflow-hidden rounded-[28px] border border-emerald-950/10 bg-white shadow-[0_35px_100px_rgba(7,74,47,.18)]">
        <div className="flex h-12 items-center gap-2 border-b border-emerald-950/8 bg-[#fbfdfb] px-5">
          <span className="size-2.5 rounded-full bg-red-300" />
          <span className="size-2.5 rounded-full bg-amber-300" />
          <span className="size-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 text-[10px] font-bold text-emerald-950/35">
            Inbox SahutAja
          </span>
        </div>
        <div className="grid min-h-[430px] grid-cols-[132px_1fr] sm:grid-cols-[220px_1fr]">
          <aside className="border-r border-emerald-950/8 bg-[#f8fbf8] p-3 sm:p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-extrabold">Percakapan</p>
              <span className="hidden rounded-full bg-emerald-100 px-2 py-1 text-[9px] font-bold text-emerald-700 sm:block">
                3 baru
              </span>
            </div>
            {[
              ["Maya", "Ukuran masih ada?", "Aktif"],
              ["Raka", "Pesanan belum sampai", "12m"],
              ["Nina", "Terima kasih", "Selesai"],
            ].map(([name, message, status], index) => (
              <div
                key={name}
                className={`mb-2 rounded-2xl p-3 ${index === 0 ? "bg-white shadow-sm ring-1 ring-emerald-950/5" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`size-2 rounded-full ${index === 0 ? "bg-emerald-500" : index === 1 ? "bg-amber-400" : "bg-zinc-300"}`}
                  />
                  <p className="truncate text-[11px] font-extrabold">{name}</p>
                </div>
                <p className="mt-1 hidden truncate text-[9px] text-emerald-950/40 sm:block">
                  {message}
                </p>
                <p className="mt-2 text-[8px] font-bold text-emerald-700">
                  {status}
                </p>
              </div>
            ))}
          </aside>
          <section className="flex min-w-0 flex-col">
            <div className="flex items-center justify-between border-b border-emerald-950/8 px-4 py-4 sm:px-5">
              <div>
                <p className="text-xs font-extrabold">Maya Putri</p>
                <p className="mt-0.5 text-[9px] text-emerald-950/40">
                  maya@email.com
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold text-emerald-700">
                AI membalas
              </span>
            </div>
            <div className="flex-1 space-y-3 bg-[#fbfdfb] p-4 sm:p-5">
              <p className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[#0c6b42] px-4 py-3 text-[11px] leading-5 text-white">
                Kemeja linen sage ukuran M masih ada?
              </p>
              <p className="max-w-[90%] rounded-2xl rounded-bl-md border border-emerald-950/6 bg-white px-4 py-3 text-[11px] leading-5 text-emerald-950/75">
                Masih ada, Kak. Ukuran M tersedia.
              </p>
              <div className="max-w-[90%] rounded-xl bg-lime-50 px-3 py-2 text-[9px] font-semibold text-lime-900">
                <Sparkles className="mr-1 inline size-3" /> Berdasarkan knowledge
                base
              </div>
            </div>
            <div className="border-t border-emerald-950/8 p-3 sm:p-4">
              <div className="flex items-center gap-2 rounded-xl border border-emerald-950/10 bg-white px-3 py-2.5 text-[10px] text-emerald-950/30">
                Tulis balasan...
                <ArrowRight className="ml-auto size-3.5" />
              </div>
            </div>
          </section>
        </div>
      </div>
      <div className="absolute -right-3 -bottom-5 flex items-center gap-3 rounded-2xl border border-emerald-950/8 bg-white px-4 py-3 shadow-xl sm:-right-7">
        <div className="grid size-9 place-items-center rounded-xl bg-lime-100 text-lime-700">
          <CircleCheck className="size-5" />
        </div>
        <p className="text-[10px] font-extrabold">Percakapan tersahut</p>
      </div>
    </div>
  )
}
