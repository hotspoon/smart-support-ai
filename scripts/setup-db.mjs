import "dotenv/config"
import { randomUUID } from "node:crypto"
import pg from "pg"

const { Pool } = pg
const connectionString = process.env.DATABASE_URL
const workspaceSlug = process.env.DEFAULT_WORKSPACE_SLUG || "halo-shop"
const model = process.env.AI_MODEL || "llama-3.3-70b-versatile"

const articles = [
  {
    title: "Bagaimana cara mengajukan refund?",
    category: "Pembayaran",
    content:
      "Refund diajukan melalui menu Pesanan dengan memilih pesanan terkait lalu Ajukan Refund. Setelah disetujui, dana diproses dalam 3–5 hari kerja.",
  },
  {
    title: "Berapa lama waktu pengiriman?",
    category: "Pengiriman",
    content:
      "Pengiriman reguler membutuhkan 2–5 hari kerja, tergantung lokasi tujuan dan kurir yang dipilih.",
  },
  {
    title: "Apakah alamat pengiriman dapat diubah?",
    category: "Pengiriman",
    content:
      "Alamat dapat diubah selama pesanan belum diproses oleh gudang. Hubungi admin jika tombol ubah alamat sudah tidak tersedia.",
  },
  {
    title: "Bagaimana menggunakan voucher?",
    category: "Promo",
    content:
      "Masukkan kode pada kolom Voucher saat checkout. Pastikan periode, minimum transaksi, dan produk yang dipilih sesuai syarat voucher.",
  },
  {
    title: "Bagaimana mengubah data akun?",
    category: "Akun",
    content:
      "Nama dan nomor telepon dapat diubah melalui Pengaturan Akun. Perubahan email membutuhkan verifikasi ulang.",
  },
  {
    title: "Kapan jam operasional customer support?",
    category: "Umum",
    content:
      "Customer support beroperasi Senin–Jumat pukul 08.00–17.00 WIB. Pesan di luar jam operasional akan ditindaklanjuti pada hari kerja berikutnya.",
  },
]

if (!connectionString) {
  console.error("DATABASE_URL belum diisi di .env")
  process.exitCode = 1
} else {
  const pool = new Pool({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 10_000,
  })
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const workspaceResult = await client.query(
      `SELECT id FROM "Workspace" WHERE slug = $1 LIMIT 1`,
      [workspaceSlug]
    )
    const workspaceId = workspaceResult.rows[0]?.id
    if (!workspaceId)
      throw new Error(`Workspace '${workspaceSlug}' belum dibuat`)

    await client.query(
      `INSERT INTO "PromptSetting"
        (id, "workspaceId", "systemPrompt", temperature, model, "autoReply", "maxHistory", "fallbackToAgent", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, 0.3, $4, true, 10, true, NOW(), NOW())
       ON CONFLICT ("workspaceId") DO UPDATE SET
         model = EXCLUDED.model,
         "updatedAt" = NOW()`,
      [
        randomUUID(),
        workspaceId,
        "Kamu adalah customer support Halo Shop yang ramah, ringkas, dan akurat. Jawab hanya berdasarkan knowledge base yang tersedia. Jika informasi tidak cukup atau pelanggan meminta tindakan pada akun, katakan dengan jujur dan eskalasikan kepada admin. Gunakan Bahasa Indonesia yang natural.",
        model,
      ]
    )

    let inserted = 0
    for (const article of articles) {
      const result = await client.query(
        `INSERT INTO "KnowledgeBase"
          (id, "workspaceId", title, content, category, "isActive", "createdAt", "updatedAt")
         SELECT $1, $2, $3, $4, $5, true, NOW(), NOW()
         WHERE NOT EXISTS (
           SELECT 1 FROM "KnowledgeBase" WHERE "workspaceId" = $2 AND title = $3
         )`,
        [
          randomUUID(),
          workspaceId,
          article.title,
          article.content,
          article.category,
        ]
      )
      inserted += result.rowCount ?? 0
    }

    await client.query("COMMIT")
    console.log(
      `Database setup OK · prompt settings ready · ${inserted} articles added`
    )
  } catch (error) {
    await client.query("ROLLBACK")
    console.error(
      `Database setup failed: ${error instanceof Error ? error.message : String(error)}`
    )
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}
