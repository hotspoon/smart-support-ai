"use client"

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 p-5 dark:bg-zinc-950">
      <section className="max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm dark:bg-zinc-900">
        <h1 className="font-heading text-xl font-extrabold">
          Terjadi gangguan
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Kami tidak dapat memuat halaman ini. Coba lagi dalam beberapa saat.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-white"
        >
          Coba lagi
        </button>
      </section>
    </main>
  )
}
