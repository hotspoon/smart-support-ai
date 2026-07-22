"use client"

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="id"><body><main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: "system-ui" }}><section style={{ textAlign: "center", maxWidth: 420 }}><h1>HaloDesk sedang bermasalah</h1><p>Silakan muat ulang halaman atau coba lagi beberapa saat lagi.</p><button onClick={reset}>Coba lagi</button></section></main></body></html>
}
