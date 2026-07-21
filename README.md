# HaloDesk

AI-first customer support workspace yang terinspirasi pola kerja Intercom dan Zendesk. Dashboard admin, public customer chat, Neon, Better Auth, dan Groq sudah terhubung sebagai satu alur live.

## Keputusan arsitektur

- **Next.js 16.2 + React 19.2** — versi stabil yang benar-benar terpasang. React 20 belum menjadi dependency proyek ini.
- **Neon PostgreSQL** — cocok untuk Vercel, serverless, relational chat history, branching database, dan MVP ini tidak membutuhkan rangkaian fitur Supabase tambahan.
- **Prisma 7 + pg adapter** — schema type-safe dan koneksi PostgreSQL eksplisit.
- **Better Auth** — autentikasi berada di database sendiri, tanpa biaya per-user dan vendor lock-in tambahan.
- **Multi-provider Chat Completions** — mendukung Groq, OpenAI, DeepSeek, Ollama, dan endpoint kompatibel lainnya. Prompt menggabungkan system instruction, knowledge base aktif, 10 pesan terakhir, dan pertanyaan saat ini.

## Yang sudah tersedia

- Dashboard dan analytics aktual dengan zona waktu `Asia/Jakarta`.
- Inbox live dengan polling, search/filter, cursor pagination, status, dan optimistic reply.
- Knowledge Base CRUD dan Prompt Settings persisten di Neon.
- Public customer chat di `/chat`, AI reply Groq, retry, dan fallback ke antrean admin.
- Schema multi-workspace untuk users, sessions, conversations, messages, knowledge base, dan settings.
- API admin mengambil workspace dan role dari session, sedangkan public chat memakai token acak dalam cookie HttpOnly.
- Idempotency pesan dan rate limiting persisten berbasis Neon.

## Menjalankan

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:setup
pnpm dev
```

Buka `http://localhost:3000` untuk dashboard admin dan `http://localhost:3000/chat` untuk customer chat.

## Menghubungkan Neon

1. Buat project Neon dan salin **pooled connection string** ke `DATABASE_URL`.
2. Isi `BETTER_AUTH_SECRET` dan `CHAT_SESSION_SECRET` dengan dua secret acak minimal 32 karakter, lalu atur `BETTER_AUTH_URL`.
3. Untuk development jalankan `pnpm db:migrate`; pada Vercel/production gunakan `prisma migrate deploy`.
4. Buat record `Workspace` dengan slug yang sama seperti `DEFAULT_WORKSPACE_SLUG`.
5. Biarkan `AUTH_DISABLE_SIGN_UP=false`, buka `/login`, lalu pilih **Setup pertama? Buat akun admin**.
6. Setelah akun pertama dibuat, ubah `AUTH_DISABLE_SIGN_UP=true` dan `AUTH_REQUIRED=true`.

Jangan pernah memakai prefix `NEXT_PUBLIC_` untuk database URL, Better Auth secret, atau AI key.

## Mengaktifkan AI dengan Groq

Isi `AI_PROVIDER=groq`, `AI_API_KEY`, `AI_BASE_URL=https://api.groq.com/openai/v1`, dan `AI_MODEL=llama-3.3-70b-versatile`. Jalankan `pnpm ai:test` untuk menguji key tanpa database. Pesan customer selalu disimpan sebelum Groq dipanggil, sehingga kegagalan provider tidak menghilangkan pesan dan conversation tetap dapat ditangani admin.

## API utama

- Public: `POST /api/public/conversations`, `GET/POST /api/public/messages`.
- Inbox: `GET /api/conversations`, `PATCH /api/conversations/:id`, `GET/POST /api/conversations/:id/messages`.
- Admin: `GET/POST/PATCH/DELETE /api/kb`, `GET/PATCH /api/settings`, dan `GET /api/analytics`.

Semua API admin memvalidasi session Better Auth melalui database. Role `AGENT` hanya dapat mengakses inbox dan pesan; KB, settings, serta analytics memerlukan `ADMIN`.

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

## Batas MVP

Channel yang aktif saat ini hanya WEB dengan polling. CSAT, attachment, widget embeddable, email notification, SSE, dan WebSocket ditunda.
