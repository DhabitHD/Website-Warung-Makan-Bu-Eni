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

**Catatan `GET /menu`:** mengembalikan **semua menu, termasuk yang `tersedia = false`** (field `tersedia` ikut terkirim) — halaman pelanggan menampilkan badge "Habis" dengan tombol nonaktif, bukan menyembunyikannya. Server menu habis ini juga menolak pada `POST /pesanan`.

### `POST /pesanan`

```jsonc
// permintaan
{
  "idPermintaan": "c9f1e2a4-...",       // id acak frontend — kunci cegah penyimpanan ganda
  "nama": "Toni",                       // nama pelanggan (dari form checkout)
  "nomorMeja": "A01",
  "catatan": "tanpa sambal",            // opsional
  "items": [ { "menuId": "lauk-01", "jumlah": 2 } ]
}
// 201 — respons
{
  "data": {
    "id": "BE-0001",
    "nama": "Toni",
    "nomorMeja": "A01",
    "status": "masuk",
    "pembayaran": "belum",
    "totalHarga": 14500,                // dihitung server
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "items": [ { "menuId": "lauk-01", "nama": "Ayam Goreng", "harga": 7000, "jumlah": 2 } ]
  }
}
```

**Aturan:**
- Jumlah `<= 0` atau id menu tidak ada → `400`. Menu `tersedia = false` → `400` dengan pesan "sedang habis".
- Format `nomorMeja` divalidasi sama dengan frontend: `[A-Za-z0-9-]`, maksimal 10 karakter.
- `items` hanya menerima `menuId` + `jumlah` — salinan nama/harga dari keranjang frontend **dibuang** (server memakai harga `menu`).
- Field `totalHarga` bila frontend ikut mengirim **diabaikan** — total selalu dihitung server.
- **Cegah penyimpanan ganda:** `idPermintaan` yang sama dikirim ulang (retry/refresh/tombol ditekan dua kali) mengembalikan pesanan lama (200), bukan membuat pesanan baru.

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

### `GET /pesanan?status=&dari=&sampai=`

```jsonc
// 200 — daftar pesanan untuk halaman pemilik (terbaru dulu)
{
  "data": [
    {
      "id": "BE-0001",
      "nama": "Toni",
      "nomorMeja": "A01",
      "status": "masuk",
      "pembayaran": "belum",
      "totalHarga": 14500,
      "dibuatPada": "2026-11-20T07:30:00.000Z"
    }
  ]
}
```

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
// "dibayar"   → server mencatat waktu dibayar (dibayarPada)
// "belum"     → dibayarPada dikosongkan kembali
// Aturan: pesanan berstatus "batal" tidak boleh ditandai dibayar (400);
//         pesanan yang sudah dibayar tidak boleh langsung "batal" —
//         ubah pembayaran ke "belum" dulu
```

---

## 4. Endpoint — Rekomendasi (integrasi AI)

| Metode | Path | Fungsi | Pemakai |
|---|---|---|---|
| `POST` | `/rekomendasi` | Minta kombinasi menu (Express → FastAPI → cek ulang → simpan riwayat) | halaman rekomendasi |

```jsonc
// permintaan
{
  "nomorMeja": "A01",           // opsional
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
// gagal (AI mati / lambat / anggaran tak masuk akal) — tetap 200, BUKAN galat,
// supaya katalog & pemesanan langsung di frontend tidak terganggu:
{
  "data": null,
  "alasan": "Rekomendasi sedang tidak tersedia. Silakan pilih menu langsung."
}
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
| 4 | **Bentuk respons rekomendasi gagal** — usulan: `200 + data: null` (lihat §4) | `200 + null` vs kode galat khusus | Arya + Wildan |
| 5 | **Pagination** daftar pesanan/pengeluaran | bawaan / tidak perlu | Dhabit + Galih |
| 6 | **`idPermintaan`** (kunci cegah ganda, lihat §2) — disetujui? | ya / hanya cek frontend | Dhabit + Arya |
| 7 | **Nama field `deskripsi`**: frontend memakai `deskripsi`, skema `keterangan_rasa` | petakan / ubah nama kolom | Dhabit + Arya |
| 8 | **Basis tanggal pemasukan rekap**: `dibayarPada` (usulan, lihat §8) vs `dibuatPada` | | Dhabit + Galih |

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
- **basis tanggal pemasukan (usulan): tanggal dibayar (`dibayarPada`), bukan tanggal pesanan dibuat** — pesanan dibuat 30 Nov tapi dibayar 1 Des masuk rekap Desember. Perlu persetujuan DS karena berpengaruh ke kamus data.

Bila DS butuh bentuk lain (mis. deret harian), tambahkan di bagian ini sebelum kontrak dikunci.
