# HaloDesk

AI-first customer support workspace yang terinspirasi pola kerja Intercom dan Zendesk. Repository sudah memiliki UI demo interaktif dan fondasi produksi untuk Neon, Prisma, Better Auth, serta provider AI yang kompatibel dengan OpenAI SDK.

## Keputusan arsitektur

- **Next.js 16.2 + React 19.2** — versi stabil yang benar-benar terpasang. React 20 belum menjadi dependency proyek ini.
- **Neon PostgreSQL** — cocok untuk Vercel, serverless, relational chat history, branching database, dan MVP ini tidak membutuhkan rangkaian fitur Supabase tambahan.
- **Prisma 7 + pg adapter** — schema type-safe dan koneksi PostgreSQL eksplisit.
- **Better Auth** — autentikasi berada di database sendiri, tanpa biaya per-user dan vendor lock-in tambahan.
- **Multi-provider Chat Completions** — mendukung Groq, OpenAI, DeepSeek, Ollama, dan endpoint kompatibel lainnya. Prompt menggabungkan system instruction, knowledge base aktif, 10 pesan terakhir, dan pertanyaan saat ini.

## Yang sudah tersedia

- Dashboard responsive dengan KPI, chart mingguan, top topics, dan recent chats.
- Inbox interaktif: search/filter, detail pelanggan, status, composer, dan tampilan mobile.
- Knowledge Base CRUD dalam UI dan Route Handler.
- Prompt/AI settings, analytics, dark mode, serta halaman login/register admin.
- Schema multi-workspace untuk users, sessions, conversations, messages, knowledge base, dan settings.
- Route Handlers: `/api/chat`, `/api/conversations`, `/api/messages`, `/api/kb`, `/api/settings`, `/api/auth/*`, dan `/api/health`.
- Demo mode tetap dapat dibuka tanpa database; integrasi server aktif setelah environment variables diisi.

## Menjalankan

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm dev
```

Buka `http://localhost:3000`. UI utama menggunakan data demo sampai query frontend dihubungkan ke workspace Neon.

## Menghubungkan Neon

1. Buat project Neon dan salin **pooled connection string** ke `DATABASE_URL`.
2. Isi `BETTER_AUTH_SECRET` dengan secret acak minimal 32 karakter dan atur `BETTER_AUTH_URL`.
3. Jalankan `pnpm db:migrate` untuk membuat tabel.
4. Buat record `Workspace` dengan slug yang sama seperti `DEFAULT_WORKSPACE_SLUG`.
5. Biarkan `AUTH_DISABLE_SIGN_UP=false`, buka `/login`, lalu pilih **Setup pertama? Buat akun admin**.
6. Setelah akun pertama dibuat, ubah `AUTH_DISABLE_SIGN_UP=true` dan `AUTH_REQUIRED=true`.

Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk database URL, Better Auth secret, atau AI key.

## Mengaktifkan AI dengan Groq

Isi `AI_PROVIDER=groq`, `AI_API_KEY`, `AI_BASE_URL=https://api.groq.com/openai/v1`, dan `AI_MODEL=llama-3.3-70b-versatile`. Jalankan `pnpm ai:test` untuk menguji key tanpa database. Endpoint chat menyimpan pesan pelanggan dan jawaban AI dalam satu transaksi, termasuk latency dan token usage. AI diwajibkan mengakui ketika knowledge base tidak cukup dan menawarkan eskalasi.

## Scripts

```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:setup
pnpm db:check
pnpm ai:test
```

## Tahap berikutnya

Setelah koneksi Neon dan provider AI tersedia, ganti source data demo pada dashboard dengan TanStack Query ke Route Handlers, tambahkan UploadThing untuk attachment, lalu pasang rate limiting dan audit log sebelum production traffic.
