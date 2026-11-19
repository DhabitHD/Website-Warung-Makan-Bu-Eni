# Backend — Warung Makan Bu Eni

REST API `/api/v1/` untuk aplikasi pemesanan Warung Makan Bu Eni.
**Node.js + Express 5 + TypeScript** — menyimpan menu, pesanan, pembayaran, pengeluaran, dan riwayat rekomendasi.

## Menjalankan

```bash
npm install
cp .env.example .env      # lalu isi nilai yang sesuai
npm run dev               # http://localhost:3000/api/v1
```

| Perintah | Fungsi |
|---|---|
| `npm run dev` | server pengembangan (tsx watch) |
| `npm run build` | kompilasi ke `dist/` |
| `npm start` | jalankan hasil build |
| `npm run typecheck` | cek tipe tanpa output |

## Struktur

```text
src/
├── config/env.ts        # validasi variabel lingkungan (Zod)
├── middleware/error.ts  # penanggal 404 & 500 — format galat seragam
├── routes/
│   ├── index.ts         # router utama /api/v1/
│   └── health.ts        # GET /api/v1/health
├── app.ts               # susunan aplikasi Express
└── server.ts            # titik masuk server
```

## Dokumen

- [`docs/SKEMA-POSTGRESQL.md`](docs/SKEMA-POSTGRESQL.md) — rancangan tabel (menu, pesanan, item, pengeluaran, riwayat rekomendasi)
- [`docs/KONTRAK-API.md`](docs/KONTRAK-API.md) — daftar endpoint & bentuk respons (draft, disepakati bersama tim)

## Status

Scaffold + `GET /api/v1/health` berjalan. Endpoint fitur menyusul sesuai jadwal proyek:

- **Minggu 2** — endpoint menu, pesanan, pengeluaran + koneksi PostgreSQL
- **Minggu 3** — integrasi layanan AI, rekap dasbor, deployment

> Data & database belum terhubung. Jangan simpan kredensial di `.env` yang dikirim ke GitHub — salinan kosongnya ada di `.env.example`.
