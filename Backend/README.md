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

## Endpoint Inti (sudah berjalan)

| Metode | Path | Akses |
|---|---|---|
| GET | `/api/v1/health` | publik. 200 bila database terhubung, 503 bila gagal |
| GET | `/api/v1/menu`, `/menu/:id` | publik. `?kategori=`, `?q=` |
| POST | `/api/v1/pesanan` | publik. Idempotensi `idPermintaan`, cek menu habis dan harga |
| GET | `/api/v1/pesanan`, `/pesanan/:id` | pemilik |
| PATCH | `/api/v1/pesanan/:id/status`, `/pesanan/:id/pembayaran` | pemilik |
| POST | `/api/v1/menu`, PATCH `/menu/:id` | pemilik. Kategori tidak bisa diubah |
| POST, GET | `/api/v1/pengeluaran` | pemilik |
| GET | `/api/v1/rekap?dari=&sampai=` | pemilik |

Pemilik memakai `Authorization: Bearer <PEMILIK_TOKEN>`. Bila `PEMILIK_TOKEN` kosong, semua akses pemilik ditolak.

## Database

```bash
cp .env.example .env              # isi DATABASE_URL dan PEMILIK_TOKEN
npm run db:migrasi -- --seed      # pasang skema dan data contoh pada database kosong
```

## Pengujian

```bash
npm run typecheck
npm run uji:api                   # API terhadap PostgreSQL 16 di Docker (container bersih)
./db/test.sh                      # skema saja, 47 kasus (lihat db/README.md)
```

`uji:api` menjalankan 23 uji API dan 6 uji unit. Hasil dan batas ujinya ada di `docs/SKEMA-POSTGRESQL.md` Lampiran A.4.

## Keputusan yang diambil di kode

- **Kategori menu tidak bisa diubah** lewat `PATCH /menu/:id`, karena awalan id (L/S) mengikuti kategori. Dibalas `400`.
- **Id menu baru** dibuat server: awalan kategori dan nomor berikutnya (`L11`, `S08`).
- **Seed contoh hanya 6 menu.** Katalog lengkap 18 menu belum dimuat ke database pengembangan (tugas B7).

## Status

- Tahap 2 (Inti): endpoint di atas sudah berjalan dan diuji terhadap PostgreSQL.
- Lanjutan (minggu 3): rekomendasi AI, `DELETE /menu/:id`, koreksi dan hapus pengeluaran, menu terlaris, login JWT.
- Deployment (M3): belum.
