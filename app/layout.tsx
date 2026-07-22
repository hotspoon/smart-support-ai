import type { Metadata } from "next"

import "./globals.css"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.BETTER_AUTH_URL ?? "http://localhost:3000"),
  title: "SahutAja — Customer Service yang Lebih Sigap",
  description:
    "Rapikan percakapan pelanggan, jawab pertanyaan rutin, dan tahu kapan tim perlu turun tangan.",
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      {
        url: "/favicon/favicon-96x96.png",
        sizes: "96x96",
        type: "image/png",
      },
    ],
    shortcut: "/favicon/favicon.ico",
    apple: {
      url: "/favicon/apple-touch-icon.png",
      sizes: "180x180",
      type: "image/png",
    },
  },
  openGraph: {
    title: "SahutAja — Setiap pelanggan pasti tersahut",
    description:
      "Customer service yang membantu timmu menjawab lebih cepat tanpa kehilangan sentuhan manusia.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SahutAja — Setiap pelanggan pasti tersahut",
    description:
      "Customer service yang membantu timmu menjawab lebih cepat tanpa kehilangan sentuhan manusia.",
    images: ["/og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className="font-sans antialiased"
    >
      <body>
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
