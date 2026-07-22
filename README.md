# SahutAja

AI-first customer service workspace. SahutAja menyatukan dashboard admin, public customer chat, Neon, Better Auth, dan Groq dalam satu alur live.

## Keputusan arsitektur

- **Next.js 16.2 + React 19.2** — versi stabil yang benar-benar terpasang. React 20 belum menjadi dependency proyek ini.
- **Neon PostgreSQL** — cocok untuk Vercel, serverless, relational chat history, branching database, dan MVP ini tidak membutuhkan rangkaian fitur Supabase tambahan.
- **Prisma 7 + pg adapter** — schema type-safe dan koneksi PostgreSQL eksplisit.
- **Better Auth** — autentikasi berada di database sendiri, tanpa biaya per-user dan vendor lock-in tambahan.
- **Multi-provider Chat Completions** — mendukung Groq, OpenAI, DeepSeek, Ollama, dan endpoint kompatibel lainnya. Prompt menggabungkan system instruction, knowledge base aktif, 10 pesan terakhir, dan pertanyaan saat ini.

## Yang sudah tersedia

- Dashboard dan analytics aktual dengan zona waktu `Asia/Jakarta`.
- Inbox live dengan polling, search/filter, pagination pesan, status, assignment, tags, dan optimistic reply.
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

Buka `http://localhost:3000` untuk landing page, `http://localhost:3000/dashboard`
untuk dashboard admin, dan `http://localhost:3000/chat` untuk customer chat.

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
- Workspace: `GET /api/agents`.
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
pnpm test:integration
```

`test:integration` wajib memakai `TEST_DATABASE_URL` dari Neon test branch yang
berbeda dari `DATABASE_URL`. Runner menolak database yang sama, menjalankan
migration, build production, fake AI lokal, integration test, lalu membersihkan
fixture. Groq asli hanya disentuh oleh `ai:test`.

Untuk memeriksa data QA lama tanpa menghapus apa pun, jalankan
`pnpm db:cleanup:integration`. Setelah ID hasil dry-run ditinjau, penghapusan
exact-match dapat dijalankan dengan `pnpm db:cleanup:integration -- --confirm`.

## Checklist Vercel production

- `DATABASE_URL` menunjuk Neon production; jangan memasang `TEST_DATABASE_URL`.
- `BETTER_AUTH_SECRET` dan `CHAT_SESSION_SECRET` berbeda dan masing-masing minimal 32 karakter.
- `BETTER_AUTH_URL` sama persis dengan domain HTTPS production.
- `AUTH_REQUIRED=true` dan `AUTH_DISABLE_SIGN_UP=true`.
- `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, serta `AI_MODEL` telah diisi.
- Jalankan `prisma migrate deploy`, typecheck, lint, build, integration test,
  `db:check`, dan `ai:test` sebelum deploy.
- Pantau `GET /api/health` dengan layanan uptime eksternal dan periksa log Vercel
  untuk kegagalan aplikasi. Endpoint ini tidak mengekspos secret atau detail database.
- Gunakan `sslmode=verify-full` pada seluruh Neon connection string untuk
  menghindari perubahan perilaku keamanan driver PostgreSQL berikutnya.

## Batas MVP

Channel yang aktif saat ini hanya WEB dengan polling. CSAT, attachment, widget embeddable, email notification, SSE, dan WebSocket ditunda.
