# Kontrak API — `/api/v1/` (DRAFT)

> **Status:** DRAFT Minggu 1 — **wajib disetujui FS + DS + AI sebelum akhir 26 Nov 2026.**
> **PIC:** Dhabit (pemilik kontrak) · **Pemakai:** Arya (frontend), Galih/Thalib (dasbor), Rifki/Wildan (rekomendasi).
> Baseline: `http://localhost:3000/api/v1` (lokal) — produksi mengikuti URL hosting (Render/Railway).

---

## 1. Konvensi

- Semua respons JSON berbahasa Indonesia untuk pesan galat.
- Masukan divalidasi **Zod** di Express (dan di frontend sebelum dikirim).
- **Harga & total selalu dihitung server** dari tabel `menu` — frontend tidak pernah mengirim total yang dipercaya.
- Waktu: ISO 8601 (`2026-11-20T07:30:00.000Z`); uang: integer Rupiah tanpa simbol.
- Belum ada autentikasi di draft ini — **Tahap 2 menambahkan sesi/token pemilik** (lihat §6).

### Bentuk galat (seragam)

```json
{ "galat": { "kode": "MASUKAN_TIDAK_SAH", "pesan": "Harga hanya boleh angka positif." } }
```

| Kode | HTTP | Dipakai saat |
|---|---|---|
| `MASUKAN_TIDAK_SAH` | 400 | Zod menolak masukan |
| `TIDAK_DITEMUKAN` | 404 | id tidak ada / rute salah |
| `TANPA_HAK` | 401/403 | belum login / bukan pemilik (Tahap 2) |
| `KONFLIK` | 409 | langkah ganda (mis. status sudah sama) |
| `SERVER` | 500 | galat tak terduga |

---

## 2. Endpoint — Katalog & Pesanan (dipakai halaman pembeli)

| Metode | Path | Fungsi | Contoh pemakai |
|---|---|---|---|
| `GET` | `/menu` | Daftar menu (`?kategori=lauk\|sayur&q=kata`) | MenuPage |
| `GET` | `/menu/:id` | Detail satu menu | — |
| `POST` | `/pesanan` | Simpan pesanan baru (hitung total di server) | CheckoutPage |
| `GET` | `/pesanan/:id` | Cek pesanan (konfirmasi, status) | OrderSuccessPage |

### `POST /pesanan`

```jsonc
// permintaan
{
  "nomorMeja": "A01",
  "catatan": "tanpa sambal",            // opsional
  "items": [ { "menuId": "lauk-01", "jumlah": 2 } ]
}
// 201 — respons
{
  "data": {
    "id": "BE-0001",
    "nomorMeja": "A01",
    "status": "masuk",
    "pembayaran": "belum",
    "totalHarga": 14500,                // dihitung server
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "items": [ { "menuId": "lauk-01", "nama": "Ayam Goreng", "harga": 7000, "jumlah": 2 } ]
  }
}
```

**Aturan:** jumlah `<= 0` atau id menu tidak ada → `400`. Menu `tersedia = false` → `400` dengan pesan "sedang habis". Tombol kirim ditekan dua kali tidak membuat dua pesanan (frontend menonaktifkan tombol saat mengirim).

---

## 3. Endpoint — Pengelolaan pemilik (halaman admin)

| Metode | Path | Fungsi | Contoh pemakai |
|---|---|---|---|
| `GET` | `/pesanan` | Daftar pesanan (`?status=&dari=&sampai=`) | AdminOrdersPage |
| `PATCH` | `/pesanan/:id/status` | Ubah status (`masuk/diproses/selesai/batal`) | AdminOrderDetailPage |
| `PATCH` | `/pesanan/:id/pembayaran` | Tandai `belum` ↔ `dibayar` | AdminOrderDetailPage |
| `POST` | `/menu` | Tambah menu | AdminMenuFormPage |
| `PATCH` | `/menu/:id` | Ubah nama/harga/kategori/ketersediaan | AdminMenuFormPage |
| `DELETE` | `/menu/:id` | Hapus menu | AdminMenuPage |
| `POST` | `/pengeluaran` | Catat pengeluaran | halaman rekap |
| `GET` | `/pengeluaran` | Daftar pengeluaran (`?dari=&sampai=`) | halaman rekap |
| `GET` | `/rekap` | Rekap keuangan per periode | AdminHistoryPage |
| `GET` | `/rekap/menu-terlaris` | Menu terlaris + jumlah pesanan | AdminOverviewPage |

### `GET /rekap?dari=2026-12-01&sampai=2026-12-31`

```jsonc
{
  "data": {
    "periode": { "dari": "2026-12-01", "sampai": "2026-12-31" },
    "pemasukan": 22000,        // hanya pesanan pembayaran = 'dibayar', data_uji = false
    "pengeluaran": 5000,
    "saldoArusKas": 17000,     // pemasukan − pengeluaran (bukan laba)
    "jumlahPesanan": 3
  }
}
```

### `PATCH /pesanan/:id/pembayaran`

```jsonc
// permintaan
{ "pembayaran": "dibayar" }
// 200 — idempoten: mengirim ulang nilai sama → 200 tanpa menghitung dua kali
```

---

## 4. Endpoint — Rekomendasi (integrasi AI)

| Metode | Path | Fungsi | Pemakai |
|---|---|---|---|
| `POST` | `/rekomendasi` | Minta kombinasi menu (Express → FastAPI → cek ulang → simpan riwayat) | halaman rekomendasi |

```jsonc
// permintaan
{
  "nomorMeja": "A01",
  "suasanaHati": "sedang",      // enum — menunggu finalisasi dari AI
  "tingkatPedas": 1,            // 0 | 1 | 2
  "anggaran": 15000
}
// 201 — respons
{
  "data": {
    "riwayatId": 42,
    "items": [ { "menuId": "lauk-03", "nama": "...", "harga": 0 } ],  // harga dari PostgreSQL
    "totalHarga": 14500,
    "alasan": "Cocok untuk suasana ... dan pedas tingkat 1.",
    "sumberModel": "fine-tune"
  }
}
// 200 dengan "data": null + pesan — bila AI gagal / anggaran tak masuk akal
// → frontend menampilkan penjelasan, katalog & pesanan langsung TETAP berfungsi
```

**Aturan server (wajib):** Express memeriksa ulang harga & ketersediaan dari PostgreSQL sebelum respons; menu `tersedia = false` dikeluarkan dari kandidat; hasil (berhasil maupun gagal) dicatat ke `riwayat_rekomendasi`; kunci API hanya di env server.

---

## 5. Endpoint — Penunjang

| Metode | Path | Fungsi |
|---|---|---|
| `GET` | `/health` | Cek kesiapan server — **sudah berjalan** ✅ |
| `POST` | `/auth/login` | Login pemilik (Tahap 2 — gantikan mock `admin/eni123`) |

---

## 6. Yang belum ada di draft ini (perlu keputusan minggu 1)

| # | Hal | Alternatif | PIC |
|---|---|---|---|
| 1 | **Autentikasi pemilik** — sesi atau Bearer token? | cookie session vs JWT | Dhabit + Arya |
| 2 | **Nama field**: `camelCase` di JSON (contoh di atas) vs `snake_case` | konsistensi dengan frontend | Dhabit + Arya |
| 3 | **Enum `suasanaHati`** — daftar nilai final | menunggu AI (Rifki/Wildan) | AI |
| 4 | **Bentuk respons rekomendasi gagal** — `data: null` vs kode galat khusus | | Arya + Wildan |
| 5 | **Pagination** daftar pesanan/pengeluaran | bawaan / tidak perlu | Dhabit + Galih |

---

## 7. Contoh masukan rekomendasi (untuk tim AI)

Bahan yang diminta plan — "contoh masukan rekomendasi tersusun":

```jsonc
[
  { "suasanaHati": "senang",     "tingkatPedas": 0, "anggaran": 10000 },
  { "suasanaHati": "sedang",     "tingkatPedas": 1, "anggaran": 15000 },
  { "suasanaHati": "capek",      "tingkatPedas": 2, "anggaran": 20000 },
  { "suasanaHati": "sedih",      "tingkatPedas": 0, "anggaran": 6000 },   // batas rendah
  { "suasanaHati": "senang",     "tingkatPedas": 2, "anggaran": 50000 },  // batas longgar
  { "suasanaHati": "tidak_jelas","tingkatPedas": 1, "anggaran": -1000 }   // masukan salah — wajib ditolak
]
```

Kasus uji wajib (dari plan): anggaran terbatas, **semua menu habis**, masukan di luar pilihan, dan layanan AI dimatikan.

---

## 8. Kebutuhan dasbor (untuk DS — Galih & Thalib)

Agar dasbor analisis terpenuhi, endpoint di §3 menyediakan:

- pemasukan & pengeluaran **per periode** (query `dari`/`sampai`) — `GET /rekap`
- **jumlah pesanan** per periode — `GET /rekap`
- **menu terlaris** — `GET /rekap/menu-terlaris`
- **waktu pesanan masuk** (pola penjualan) — `GET /pesanan?dari=&sampai=` mengembalikan `dibuatPada`
- hanya transaksi `pembayaran = 'dibayar'` dan `data_uji = false` yang dihitung

Bila DS butuh bentuk lain (mis. deret harian), tambahkan di bagian ini sebelum kontrak dikunci.
