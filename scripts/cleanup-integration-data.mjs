import "dotenv/config"

import pg from "pg"

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL belum dikonfigurasi")
  process.exit(1)
}

const confirm = process.argv.includes("--confirm")
const client = new pg.Client({ connectionString: process.env.DATABASE_URL })

try {
  await client.connect()
  const found = await client.query(
    `select c.id, c."workspaceId", count(m.id)::int as "messageCount"
       from "Conversation" c
       left join "Message" m on m."conversationId" = c.id
      where c."customerName" = $1 and c."customerEmail" = $2
      group by c.id, c."workspaceId"
      order by c.id`,
    ["Integration Test", "integration@example.com"]
  )

  console.log(
    JSON.stringify(
      {
        mode: confirm ? "delete" : "dry-run",
        matches: found.rows,
        count: found.rowCount,
      },
      null,
      2
    )
  )

  if (!confirm) {
    console.log(
      "Tidak ada data yang dihapus. Jalankan kembali dengan --confirm."
    )
  } else if (found.rowCount) {
    const ids = found.rows.map((row) => row.id)
    const deleted = await client.query(
      `delete from "Conversation"
        where id = any($1::text[])
          and "customerName" = $2
          and "customerEmail" = $3
        returning id`,
      [ids, "Integration Test", "integration@example.com"]
    )
    console.log(
      `Terhapus ${deleted.rowCount} conversation; pesan terhapus via cascade.`
    )
  }
} finally {
  await client.end()
}
