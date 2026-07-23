"use client"

import { useState } from "react"
import Image from "next/image"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { authClient } from "@/lib/auth-client"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    const credentials = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    }
    try {
      const result = await authClient.signIn.email({
        ...credentials,
        rememberMe: true,
      })
      if (result.error) {
        setError(result.error.message ?? "Email atau password tidak valid")
        setLoading(false)
        return
      }
      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError("Tidak dapat terhubung. Coba lagi beberapa saat.")
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-svh bg-[#f7faf7] text-[#10251b] lg:grid-cols-[1.05fr_.95fr]">
      <section className="relative hidden overflow-hidden border-r border-emerald-950/8 bg-[#f7faf7] p-12 lg:flex lg:flex-col">
        <div className="absolute top-8 -left-24 size-96 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="absolute right-0 -bottom-24 size-96 rounded-full bg-emerald-300/20 blur-3xl" />
        <Image src="/sahutaja_logo.png" alt="SahutAja AI Customer Service" width={352} height={192} priority className="h-auto w-48 object-contain object-left" />
        <div className="relative my-auto max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/75 px-3 py-1.5 text-[10px] font-bold text-emerald-700 shadow-sm backdrop-blur">
            <Sparkles className="size-3" />
            CUSTOMER SERVICE YANG LEBIH SIGAP
          </span>
          <h1 className="mt-7 font-heading text-5xl leading-[1.08] font-extrabold tracking-[-.04em] text-emerald-950">
            Support pelanggan,
            <br />
            <span className="text-[#0c6b42]">tanpa kewalahan.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-emerald-950/60">
            Satu tempat untuk merapikan percakapan, menyimpan jawaban bisnis,
            dan membantu tim menangani pelanggan tanpa kehilangan konteks.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            {[
              "Jawaban dari knowledge base",
              "Inbox percakapan terpusat",
              "Bisa diambil alih admin",
              "Riwayat percakapan tersimpan",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-2xl border border-emerald-950/8 bg-white/70 px-3 py-3 text-xs font-semibold text-emerald-950/70 shadow-sm"
              >
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[10px] text-emerald-950/40">
          © 2026 SahutAja. Setiap pelanggan pasti tersahut.
        </p>
      </section>
      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          <Image src="/sahutaja_logo.png" alt="SahutAja AI Customer Service" width={352} height={192} priority className="mb-10 h-auto w-44 object-contain object-left lg:hidden" />
          <p className="text-[10px] font-bold tracking-[.18em] text-emerald-600 uppercase">
            Admin workspace
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.035em]">
            Selamat datang kembali
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            Masuk untuk mengelola percakapan pelanggan.
          </p>
          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-[11px] font-bold">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@sahutaja.id"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold">Password</span>
              <div className="relative mt-2">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-11 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10"
                />
                <button
                  type="button"
                  aria-label="Tampilkan password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1.5 right-1.5 grid size-8 place-items-center text-zinc-400"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </label>
            <button
              disabled={loading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0c6b42] text-xs font-bold text-white shadow-lg shadow-emerald-900/15 hover:bg-[#075c38] disabled:opacity-60"
            >
              {loading ? "Memverifikasi..." : "Masuk ke workspace"}
              <ArrowRight className="size-4" />
            </button>
          </form>
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Sesi masuk terenkripsi
          </div>
        </div>
      </section>
    </main>
  )
}
