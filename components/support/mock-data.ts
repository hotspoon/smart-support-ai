export type ConversationStatus = "OPEN" | "WAITING" | "RESOLVED"
export type Sender = "USER" | "AI" | "ADMIN"

export type Message = {
  id: string
  sender: Sender
  content: string
  time: string
}

export type Conversation = {
  id: string
  customer: string
  email: string
  initials: string
  color: string
  status: ConversationStatus
  preview: string
  time: string
  unread: number
  channel: "Web" | "WhatsApp" | "Email"
  tags: string[]
  messages: Message[]
}

export const conversations: Conversation[] = [
  {
    id: "conv_01",
    customer: "Dinda Maharani",
    email: "dinda@email.com",
    initials: "DM",
    color:
      "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    status: "WAITING",
    preview: "Bagaimana cara mengajukan refund?",
    time: "2m",
    unread: 2,
    channel: "Web",
    tags: ["Refund", "Priority"],
    messages: [
      {
        id: "m1",
        sender: "USER",
        content: "Halo, saya butuh bantuan untuk pesanan saya.",
        time: "10:31",
      },
      {
        id: "m2",
        sender: "AI",
        content:
          "Halo Dinda! Tentu, saya siap membantu. Ada kendala apa dengan pesanannya?",
        time: "10:31",
      },
      {
        id: "m3",
        sender: "USER",
        content:
          "Barang yang datang tidak sesuai. Bagaimana cara mengajukan refund?",
        time: "10:32",
      },
      {
        id: "m4",
        sender: "AI",
        content:
          "Maaf atas ketidaknyamanannya. Refund dapat diajukan dari menu Pesanan > Pilih pesanan > Ajukan Refund. Setelah disetujui, dana diproses dalam 3–5 hari kerja. Apakah kamu ingin saya bantu cek syarat pengembaliannya?",
        time: "10:32",
      },
    ],
  },
  {
    id: "conv_02",
    customer: "Rizky Pratama",
    email: "rizky.p@email.com",
    initials: "RP",
    color: "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
    status: "OPEN",
    preview: "Pesanan saya belum sampai",
    time: "8m",
    unread: 1,
    channel: "WhatsApp",
    tags: ["Shipping"],
    messages: [
      {
        id: "r1",
        sender: "USER",
        content: "Pesanan saya belum sampai, bisa dibantu cek?",
        time: "10:25",
      },
      {
        id: "r2",
        sender: "AI",
        content:
          "Tentu. Boleh kirim nomor pesanannya agar saya bisa membantu mengecek?",
        time: "10:25",
      },
    ],
  },
  {
    id: "conv_03",
    customer: "Kevin Wijaya",
    email: "kevinw@email.com",
    initials: "KW",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    status: "RESOLVED",
    preview: "Terima kasih, sudah berhasil!",
    time: "24m",
    unread: 0,
    channel: "Email",
    tags: ["Account"],
    messages: [
      {
        id: "k1",
        sender: "USER",
        content: "Saya tidak bisa mengubah email akun.",
        time: "10:02",
      },
      {
        id: "k2",
        sender: "ADMIN",
        content:
          "Kami sudah mengirim tautan verifikasi baru. Silakan cek inbox dan folder spam ya.",
        time: "10:08",
      },
      {
        id: "k3",
        sender: "USER",
        content: "Terima kasih, sudah berhasil!",
        time: "10:14",
      },
    ],
  },
  {
    id: "conv_04",
    customer: "Nadia Putri",
    email: "nadia@email.com",
    initials: "NP",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
    status: "OPEN",
    preview: "Apakah bisa ganti alamat pengiriman?",
    time: "31m",
    unread: 0,
    channel: "Web",
    tags: ["Shipping"],
    messages: [
      {
        id: "n1",
        sender: "USER",
        content: "Apakah saya masih bisa mengganti alamat pengiriman?",
        time: "09:55",
      },
    ],
  },
  {
    id: "conv_05",
    customer: "Andi Setiawan",
    email: "andi.s@email.com",
    initials: "AS",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300",
    status: "RESOLVED",
    preview: "Kode voucher sudah bisa dipakai",
    time: "1h",
    unread: 0,
    channel: "WhatsApp",
    tags: ["Promo"],
    messages: [
      {
        id: "a1",
        sender: "USER",
        content: "Kode voucher saya tidak bisa digunakan.",
        time: "09:06",
      },
      {
        id: "a2",
        sender: "AI",
        content:
          "Pastikan minimum transaksi Rp150.000 dan voucher belum melewati masa berlaku.",
        time: "09:06",
      },
      {
        id: "a3",
        sender: "USER",
        content: "Kode voucher sudah bisa dipakai. Terima kasih!",
        time: "09:08",
      },
    ],
  },
]

export const weeklyData = [
  { day: "Sen", conversations: 78, resolved: 62 },
  { day: "Sel", conversations: 92, resolved: 74 },
  { day: "Rab", conversations: 84, resolved: 71 },
  { day: "Kam", conversations: 108, resolved: 86 },
  { day: "Jum", conversations: 120, resolved: 96 },
  { day: "Sab", conversations: 76, resolved: 64 },
  { day: "Min", conversations: 68, resolved: 58 },
]

export const initialKnowledge = [
  {
    id: "kb1",
    title: "Bagaimana cara mengajukan refund?",
    category: "Pembayaran",
    content:
      "Refund diajukan melalui menu Pesanan. Dana akan diproses dalam 3–5 hari kerja setelah pengajuan disetujui.",
    updated: "Hari ini",
  },
  {
    id: "kb2",
    title: "Berapa lama waktu pengiriman?",
    category: "Pengiriman",
    content:
      "Pengiriman reguler membutuhkan 2–5 hari kerja, tergantung lokasi tujuan dan kurir yang dipilih.",
    updated: "Kemarin",
  },
  {
    id: "kb3",
    title: "Cara mengubah data akun",
    category: "Akun",
    content:
      "Nama dan nomor telepon dapat diubah melalui Pengaturan Akun. Perubahan email membutuhkan verifikasi ulang.",
    updated: "18 Jul 2026",
  },
  {
    id: "kb4",
    title: "Syarat penggunaan voucher",
    category: "Promo",
    content:
      "Voucher berlaku sesuai periode dan minimum transaksi yang tercantum. Satu voucher berlaku untuk satu transaksi.",
    updated: "16 Jul 2026",
  },
]
