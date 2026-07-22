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
  const [register, setRegister] = useState(false)
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
    const result = register
      ? await authClient.signUp.email({
          ...credentials,
          name: String(form.get("name")),
        })
      : await authClient.signIn.email({ ...credentials, rememberMe: true })
    setLoading(false)
    if (result.error)
      return setError(result.error.message ?? "Email atau password tidak valid")
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <main className="grid min-h-svh bg-zinc-50 lg:grid-cols-[1.05fr_.95fr] dark:bg-zinc-950">
      <section className="relative hidden overflow-hidden bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute top-20 -left-24 size-80 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="absolute right-0 -bottom-24 size-96 rounded-full bg-violet-500/10 blur-3xl" />
        <Image src="/sahutaja_logo.png" alt="SahutAja AI Customer Service" width={352} height={192} priority className="h-auto w-48 object-contain object-left" />
        <div className="relative my-auto max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-bold text-emerald-400">
            <Sparkles className="size-3" />
            CUSTOMER SERVICE YANG LEBIH SIGAP
          </span>
          <h1 className="mt-7 font-heading text-5xl leading-[1.08] font-extrabold tracking-[-.04em]">
            Support pelanggan,
            <br />
            <span className="text-emerald-400">tanpa kewalahan.</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-7 text-zinc-400">
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
                className="flex items-center gap-2 text-xs text-zinc-300"
              >
                <CheckCircle2 className="size-4 text-emerald-400" />
                {item}
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[10px] text-zinc-600">
          © 2026 SahutAja. Setiap pelanggan pasti tersahut.
        </p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[400px]">
          <Image src="/sahutaja_logo.png" alt="SahutAja AI Customer Service" width={352} height={192} priority className="mb-10 h-auto w-44 object-contain object-left lg:hidden" />
          <p className="text-[10px] font-bold tracking-[.18em] text-emerald-600 uppercase">
            Admin workspace
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.035em]">
            {register ? "Buat admin pertama" : "Selamat datang kembali"}
          </h2>
          <p className="mt-2 text-xs text-zinc-500">
            {register
              ? "Siapkan akun pemilik workspace SahutAja."
              : "Masuk untuk mengelola percakapan pelanggan."}
          </p>
          {error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
              {error}
            </div>
          )}
          <form onSubmit={submit} className="mt-8 space-y-5">
            {register && (
              <label className="block">
                <span className="text-[11px] font-bold">Nama lengkap</span>
                <input
                  name="name"
                  required
                  placeholder="Faris Admin"
                  className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
                />
              </label>
            )}
            <label className="block">
              <span className="text-[11px] font-bold">Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="admin@sahutaja.id"
                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
              />
            </label>
            <label className="block">
              <div className="flex justify-between">
                <span className="text-[11px] font-bold">Password</span>
                <button
                  type="button"
                  className="text-[10px] font-semibold text-emerald-600"
                >
                  Lupa password?
                </button>
              </div>
              <div className="relative mt-2">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  placeholder="Minimal 8 karakter"
                  className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 pr-11 text-xs transition outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
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
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 text-xs font-bold text-white shadow-lg shadow-zinc-950/10 hover:bg-zinc-800 disabled:opacity-60 dark:bg-emerald-500 dark:hover:bg-emerald-600"
            >
              {loading
                ? "Memverifikasi..."
                : register
                  ? "Buat akun admin"
                  : "Masuk ke workspace"}
              <ArrowRight className="size-4" />
            </button>
          </form>
          <button
            onClick={() => {
              setRegister(!register)
              setError("")
            }}
            className="mt-5 w-full text-center text-[10px] font-semibold text-zinc-500 hover:text-emerald-600"
          >
            {register
              ? "Sudah punya akun? Masuk"
              : "Setup pertama? Buat akun admin"}
          </button>
          <div className="mt-7 flex items-center justify-center gap-2 text-[10px] text-zinc-400">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            Sesi masuk terenkripsi
          </div>
        </div>
      </section>
    </main>
  )
}
