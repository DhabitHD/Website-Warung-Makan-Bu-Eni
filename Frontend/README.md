# Website Warung Makan Bu Eni

Website pemesanan makanan untuk warung rumahan dengan sistem QR Code. Pelanggan cukup **scan QR**, melihat menu, memilih lauk/sayur, memasukkan ke keranjang, dan melakukan checkout.

Bagian ini berisi **frontend** (React + Vite + TypeScript).

## Cara instalasi & penyiapan

Prasyarat: **Node.js 20+** dan **npm**.

```bash
# 1. Masuk ke folder frontend
cd Frontend

# 2. Instal dependensi
npm install

# 3. Jalankan server development
npm run dev
```

Buka alamat yang muncul di terminal (biasanya `http://localhost:5173`).

### Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Server development dengan hot reload |
| `npm run build` | Build produksi ke folder `dist/` |
| `npm run preview` | Menjalankan hasil build produksi |
| `npx tsc -b` | Pengecekan tipe data (typecheck) |

## Cara penggunaan (alur pelanggan)

1. Pelanggan **scan QR** di meja (URL: `/menu?table=A01` — nomor meja dibaca otomatis dari query string).
2. Halaman **Daftar menu** terbuka: pilih filter `Semua / Lauk / Sayur` atau gunakan kolom pencarian.
3. Klik **+ Tambah** pada makanan yang diinginkan.
4. Ringkasan **Pesananmu** di samping menampilkan item dan total sementara.
5. Klik **Lihat keranjang** → checkout → kirim pesanan → konfirmasi.

## Teknologi

React · Vite · TypeScript · Tailwind CSS · shadcn/ui · React Router DOM · Zustand · TanStack Query · React Hook Form · Zod · Lucide React

## Struktur proyek

Feature-based architecture — rincian lengkap ada di [`docs/STANDARDS.md`](docs/STANDARDS.md).

```text
src/
├── components/   # ui (shadcn), layout, shared
├── features/     # menu, cart, checkout
├── pages/        # MenuPage, CartPage, CheckoutPage, OrderSuccessPage
├── routes/       # routing React Router
├── services/     # API client (Tahap 4)
├── types/        # kontrak tipe data
└── lib/          # utilitas (cn, format rupiah)
```

## Status pengembangan

| Tahap | Isi | Status |
|---|---|---|
| 1 | Project setup | ✅ |
| 2 | Design system & fondasi | ✅ |
| 3 | Fitur halaman menu | ✅ |
| 4 | Integrasi API | ⏳ menyusul |
| 5 | Testing & deployment | ⏳ menyusul |

### Fase 2 — Admin Dashboard

| Bagian | Isi | Status |
|---|---|---|
| Dhabit (Lead) | Login admin, layout & routing `/admin/*`, CRUD menu + harga + ketersediaan | ✅ |
| Arya | Dashboard pesanan, detail & status pesanan, riwayat, ringkasan transaksi | ⏳ (kerangka rute siap) |

Buka `http://localhost:5173/admin/login` — akun demo: **admin** / **eni123**.

> Data menu saat ini masih **mock** (`src/features/menu/services/menu.mock.ts`) dan akan diganti dengan respons API pada Tahap 4. Login admin juga masih mock — auth asli menyusul bersama backend.
