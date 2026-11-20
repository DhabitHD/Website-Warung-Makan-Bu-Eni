# Kontrak API `/api/v1/` — Versi 2

> **Status:** DRAFT siap disepakati — target persetujuan **26 Nov 2026** (akhir Minggu 1).
> **Pemilik kontrak:** Dhabit · **Pemakai:** Arya (pembeli & pemilik di frontend), Galih & Mohammad Thalib (dasbor), Rifki & Wildan (rekomendasi).
> **Basis data:** lihat `SKEMA-POSTGRESQL.md` (versi 2). Pemetaan nama JSON ↔ kolom DB ada di bagian 1.4.
> **Baseline:** `http://localhost:3000/api/v1` (lokal). Produksi mengikuti URL hosting (Render/Railway).

---

## 0. Ringkasan perubahan dari versi 1

| Perubahan | Alasan |
|---|---|
| Ditambahkan **matriks akses** (publik vs pemilik) per endpoint | Plan Risiko E & uji "pengguna tanpa hak tidak dapat membaca atau mengubah data pemilik" |
| Ditambahkan **aturan transisi status** pesanan | Plan uji status: "status selesai saja tidak menambah pemasukan" |
| Ditambahkan **endpoint yang hilang**: ubah/hapus pengeluaran, pola waktu pesanan masuk | Plan: pencatatan pengeluaran harus bisa dikoreksi; dasbor wajib menampilkan waktu pesanan masuk |
| Nilai status diseragamkan ke **`masuk`** (sebelumnya `diterima` di frontend) | Satu sumber kebenaran; frontend diminta menyesuaikan |
| Format **id pesanan** ditetapkan `BE-0001` (dibuat server) | Frontend saat ini membuat `BE-YYYYMMDD-NNNN` sendiri — tidak boleh |
| Rekomendasi gagal memberi **`kodeAlasan`** terstruktur | Frontend bisa menampilkan penjelasan yang tepat per kasus uji |
| Galat validasi memuat **`rincian` per field** | Plan: aplikasi "menunjukkan bagian yang perlu diperbaiki" |
| Definisi **periode** dan **zona waktu** (Asia/Jakarta) | Tanpa ini rekap bisa geser satu hari untuk pesanan malam |

---

## 1. Konvensi umum

### 1.1 Format
- Semua body: **JSON**, karakter **UTF-8**.
- Sukses satu data: `{ "data": { ... } }`. Sukses daftar: `{ "data": [ ... ] }`.
- Tidak ada pagination di MVP (volume satu warung kecil). Keputusan ditinjau ulang bila data > 1.000 pesanan.

### 1.2 Format galat (seragam)

```json
{
  "galat": {
    "kode": "MASUKAN_TIDAK_SAH",
    "pesan": "Ada isian yang belum benar.",
    "rincian": [
      { "field": "items.0.jumlah", "pesan": "Jumlah minimal 1." }
    ]
  }
}
```

`rincian` hanya ada untuk galat validasi (`MASUKAN_TIDAK_SAH`) dan galat per item (`MENU_HABIS`, `HARGA_BERUBAH`). Bagian lain boleh tidak ada.

| Kode | HTTP | Dipakai saat |
|---|---|---|
| `MASUKAN_TIDAK_SAH` | 400 | Zod menolak masukan (kosong, negatif, format salah, tanggal tidak valid) |
| `MENU_HABIS` | 400 | Ada item dengan `tersedia = false`. `rincian` berisi `menuId` yang habis |
| `TANPA_HAK` | 401 | Belum login, atau token tidak sah / kedaluwarsa |
| `AKSES_DITOLAK` | 403 | Sudah login tetapi bukan pemilik (tidak dipakai di MVP, disiapkan) |
| `TIDAK_DITEMUKAN` | 404 | id tidak ada atau rute salah |
| `KONFLIK` | 409 | Transisi status tidak diizinkan (lihat 2.2) |
| `HARGA_BERUBAH` | 409 | Harga di server berbeda dari `hargaDiharapkan`. `rincian` berisi harga terbaru |
| `SERVER` | 500 | Galat tak terduga (detail hanya dicatat di log server) |

### 1.3 Aturan wajib
- **Harga dan total dihitung server** dari tabel `menu`. Field `totalHarga` dari klien **diabaikan**.
- **Uang** selalu integer Rupiah tanpa simbol (`14500`).
- **Waktu** dikirim sebagai ISO 8601 UTC (`2026-11-20T07:30:00.000Z`).
- **Tanggal periode** (`dari`, `sampai`) format `YYYY-MM-DD`, dihitung dalam zona **Asia/Jakarta**. Tanggal pesanan dan pembayaran dikonversi ke WIB sebelum dibandingkan.
- Masukan divalidasi **Zod** di Express. Frontend juga memvalidasi lebih dulu, tetapi server tetap yang berwenang.
- Nilai `data_uji` **tidak pernah diterima dari klien**. Hanya skrip seed yang mengisinya.

### 1.4 Pemetaan nama JSON ↔ kolom database

Express mengubah dari `snake_case` (DB) ke `camelCase` (JSON). Frontend hanya melihat camelCase.

| JSON (kontrak) | Kolom DB | Catatan |
|---|---|---|
| `id` (menu) | `menu.id` | contoh `lauk-01` |
| `keteranganRasa` | `menu.keterangan_rasa` | **frontend sekarang memakai `deskripsi`** — ganti |
| `porsi` | `menu.porsi` | wajib dalam plan; nullable |
| `tersedia` | `menu.tersedia` | `false` = habis |
| `id` (pesanan) | `pesanan.id` | `BE-0001`, dibuat server |
| `idPermintaan` | `pesanan.id_permintaan` | UUID dari klien |
| `nama` (pesanan) | `pesanan.nama_pelanggan` | nama dari form checkout |
| `nomorMeja` | `pesanan.nomor_meja` | |
| `dibuatPada` | `pesanan.dibuat_pada` | |
| `dibayarPada` | `pesanan.dibayar_pada` | `null` bila belum dibayar |
| `menuId` (item) | `item_pesanan.menu_id` | frontend sekarang memakai `itemId` — ganti |
| `subtotal` | `item_pesanan.subtotal` | kolom terhitung `harga × jumlah` |

---

## 2. Enum, status, dan aturan transisi

### 2.1 Nilai tetap

| Field | Nilai yang valid |
|---|---|
| `kategori` | `lauk`, `sayur` |
| `status` pesanan | `masuk`, `diproses`, `selesai`, `batal` |
| `pembayaran` | `belum`, `dibayar` |
| `tingkatPedas` | `0`, `1`, `2` |
| `suasanaHati` | **menunggu daftar final dari AI** (lihat bagian 9) |
| `sumberModel` | `fine-tune`, `llm`, `gagal` |
| `kodeAlasan` (rekomendasi gagal) | `AI_TIDAK_TERSEDIA`, `ANGGARAN_TERLALU_RENDAH`, `MENU_TIDAK_CUKUP` |

### 2.2 Transisi status pesanan

| Dari | Ke | Diizinkan |
|---|---|---|
| `masuk` | `diproses` | ya |
| `diproses` | `selesai` | ya |
| `masuk` / `diproses` | `batal` | ya |
| `selesai` / `batal` | apa pun | **tidak** (`409 KONFLIK`) |
| sama dengan status sekarang | — | ya, `200` tanpa perubahan (idempoten) |

### 2.3 Aturan pembayaran

- `belum` → `dibayar`: `dibayarPada` diisi waktu server.
- `dibayar` → `belum`: `dibayarPada` dikosongkan. Dipakai bila pembayaran salah dicatat.
- Pesanan `batal` **tidak boleh** ditandai `dibayar` (`409 KONFLIK`).
- Pesanan `dibayar` **tidak boleh** langsung dibatalkan. Ubah pembayaran ke `belum` dulu, baru batalkan (`409 KONFLIK`).
- Status `selesai` **tidak** mengubah pemasukan. Yang menentukan pemasukan hanya `pembayaran = dibayar`.

---

## 3. Matriks akses

| Endpoint | Publik | Pemilik |
|---|:-:|:-:|
| `GET /health` | ✓ | ✓ |
| `GET /menu`, `GET /menu/:id` | ✓ | ✓ |
| `POST /pesanan` | ✓ | ✓ |
| `GET /pesanan/:id` | ✓ (ringkas, lihat 4.3) | ✓ (lengkap) |
| `POST /rekomendasi` | ✓ | ✓ |
| `POST /auth/login` | ✓ | — |
| `GET /pesanan` (daftar) | — | ✓ |
| `PATCH /pesanan/:id/status`, `PATCH /pesanan/:id/pembayaran` | — | ✓ |
| `POST/PATCH/DELETE /menu` | — | ✓ |
| `POST/GET/PATCH/DELETE /pengeluaran` | — | ✓ |
| `GET /rekap/*` | — | ✓ |

Pengguna tanpa token yang mencoba endpoint pemilik menerima `401 TANPA_HAK`. Data tidak dikembalikan sama sekali.

---

## 4. Katalog dan pesanan (publik — dipakai halaman pembeli)

### 4.1 `GET /menu`

Query opsional: `kategori=lauk|sayur`, `q=kata` (pencarian nama, tidak peka huruf besar-kecil).

**Penting:** endpoint ini mengembalikan **semua menu, termasuk yang habis**. Halaman pelanggan menampilkan badge "Habis" dengan tombol nonaktif. Menu habis tidak disembunyikan.

```jsonc
// 200
{
  "data": [
    {
      "id": "lauk-01",
      "nama": "Ayam Goreng",
      "kategori": "lauk",
      "harga": 7000,
      "porsi": "1 potong",
      "foto": "ayamgoreng.jpg",
      "keteranganRasa": "Gurih, bumbu ungkep, digoreng kering.",
      "tersedia": true
    }
  ]
}
```

### 4.2 `GET /menu/:id`
Sama seperti satu item di atas. `404 TIDAK_DITEMUKAN` bila id tidak ada.

### 4.3 `POST /pesanan`

**Permintaan:**

```jsonc
{
  "idPermintaan": "3f6b8e2a-6d1f-4c7e-9a10-2b5f0c9d1e77", // UUID dibuat frontend saat checkout dibuka
  "nama": "Toni",                                       // 2–60 karakter
  "nomorMeja": "A01",                                   // A–Z, a–z, 0–9, '-'; maks 10 karakter
  "catatan": "tanpa sambal",                            // opsional, maks 200 karakter
  "items": [
    { "menuId": "lauk-01", "jumlah": 2, "hargaDiharapkan": 7000 },  // hargaDiharapkan opsional
    { "menuId": "sayur-03", "jumlah": 1 }
  ]
}
```

**Aturan validasi:**
- `items` minimal 1 baris. Setiap `jumlah` bilangan bulat **1–50** (batas 50 usulan).
- `menuId` harus ada di tabel `menu`.
- Item dengan `tersedia = false` → `400 MENU_HABIS`.
- `hargaDiharapkan` (opsional) adalah harga yang dilihat pembeli saat memasukkan item ke keranjang. Bila berbeda dengan harga server → `409 HARGA_BERUBAH`.
- Field `nama`, `nomorMeja`, `catatan` diperiksa dengan aturan yang sama dengan frontend.
- Salinan nama dan harga dari keranjang frontend **tidak dipakai**. Server mengambil nama dan harga dari tabel `menu`.

**Respons sukses (`201`):**

```jsonc
{
  "data": {
    "id": "BE-0001",
    "nama": "Toni",
    "nomorMeja": "A01",
    "catatan": "tanpa sambal",
    "status": "masuk",
    "pembayaran": "belum",
    "totalHarga": 17000,
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "dibayarPada": null,
    "items": [
      { "menuId": "lauk-01", "nama": "Ayam Goreng", "harga": 7000, "jumlah": 2, "subtotal": 14000 },
      { "menuId": "sayur-03", "nama": "Sop Bening", "harga": 3000, "jumlah": 1, "subtotal": 3000 }
    ]
  }
}
```

**Idempotensi:** bila `idPermintaan` yang sama dikirim lagi (retry jaringan, refresh, tombol ditekan dua kali), server **mengembalikan pesanan yang sudah ada dengan `200`**, bukan membuat pesanan baru. Isi permintaan kedua tidak diperiksa ulang.

**Galat `HARGA_BERUBAH` (`409`):**

```jsonc
{
  "galat": {
    "kode": "HARGA_BERUBAH",
    "pesan": "Ada harga yang berubah. Periksa pesanan Anda sebelum mengirim.",
    "rincian": [
      { "menuId": "lauk-01", "hargaDiharapkan": 7000, "hargaTerkini": 8000 }
    ]
  }
}
```

Frontend menampilkan harga baru, memperbarui keranjang, lalu meminta pembeli menekan kirim lagi. Ini memenuhi skenario uji "pembeli menerima pemberitahuan sebelum melanjutkan pesanan".

### 4.4 `GET /pesanan/:id` (publik, ringkas)

Dipakai halaman konfirmasi (`OrderSuccessPage`). Untuk melindungi data pelanggan, respons publik **tidak** memuat `nama` dan `catatan`.

```jsonc
{
  "data": {
    "id": "BE-0001",
    "nomorMeja": "A01",
    "status": "masuk",
    "pembayaran": "belum",
    "totalHarga": 17000,
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "items": [ { "nama": "Ayam Goreng", "jumlah": 2, "subtotal": 14000 } ]
  }
}
```

Pemilik memakai endpoint yang sama dengan token dan mendapat field lengkap.

---

## 5. Pengelolaan pemilik (butuh token)

### 5.1 `GET /pesanan`
Query opsional: `status`, `pembayaran`, `dari`, `sampai` (filter berdasarkan `dibuatPada`, dalam WIB). Diurutkan terbaru dulu. Mengembalikan field lengkap termasuk `nama` dan `catatan`.

### 5.2 `GET /pesanan/:id`
Versi lengkap (lihat 5.1 untuk field tambahan).

### 5.3 `PATCH /pesanan/:id/status`

```jsonc
// permintaan
{ "status": "diproses" }
// 200 — status baru. Aturan transisi di bagian 2.2.
// 409 KONFLIK — transisi tidak diizinkan.
```

### 5.4 `PATCH /pesanan/:id/pembayaran`

```jsonc
// permintaan
{ "pembayaran": "dibayar" }
// 200 — dibayarPada terisi waktu server. Mengirim ulang "dibayar" → 200 tanpa mengubah dibayarPada.
// 409 KONFLIK — pesanan berstatus batal, atau pesanan dibayar yang akan dibatalkan (lihat 2.3).
```

### 5.5 Menu

| Metode | Path | Fungsi |
|---|---|---|
| `POST` | `/menu` | Tambah menu. Body sama dengan field di 4.1 tanpa `id` (server membuat `id`) |
| `PATCH` | `/menu/:id` | Ubah sebagian field, termasuk `tersedia` untuk menandai habis |
| `DELETE` | `/menu/:id` | Hapus menu. Riwayat pesanan tetap utuh karena nama dan harga sudah disalin |

Validasi (sesuai form admin yang sudah ada): `nama` 2–60 karakter, `harga` bilangan bulat 0–10.000.000, `kategori` salah satu dari dua nilai, `foto` wajib, `keteranganRasa` maks 200 karakter.

### 5.6 Pengeluaran

| Metode | Path | Fungsi |
|---|---|---|
| `POST` | `/pengeluaran` | Catat pengeluaran |
| `GET` | `/pengeluaran` | Daftar, query `dari`, `sampai` |
| `PATCH` | `/pengeluaran/:id` | Koreksi nominal, tanggal, atau keterangan |
| `DELETE` | `/pengeluaran/:id` | Hapus catatan yang salah |

```jsonc
// POST /pengeluaran — permintaan
{ "keterangan": "Beli bahan baku", "nominal": 150000, "tanggal": "2026-12-03" }
// 201 — data tersimpan. Nominal ≤ 0, bukan angka, atau tanggal tidak valid → 400 dengan rincian.
```

Validasi tanggal: format `YYYY-MM-DD`, tidak boleh di masa depan (dibandingkan dengan tanggal WIB saat ini di Zod, bukan di database).

### 5.7 Rekap dan dasbor

Semua rekap memakai aturan yang sama: **hanya** `pembayaran = dibayar` dan `data_uji = false` yang masuk pemasukan. Periode dihitung dengan tanggal **pembayaran** (`dibayarPada`, WIB), bukan tanggal pesanan dibuat.

#### `GET /rekap?dari=2026-12-01&sampai=2026-12-31`

```jsonc
{
  "data": {
    "periode": { "dari": "2026-12-01", "sampai": "2026-12-31" },
    "pemasukan": 22000,          // jumlah total_harga pesanan dibayar dalam periode
    "pengeluaran": 5000,         // jumlah nominal pengeluaran dalam periode
    "saldoArusKas": 17000,       // pemasukan − pengeluaran (BUKAN laba bersih)
    "jumlahPesananDibayar": 2,   // basis rekap pemasukan
    "jumlahPesananMasuk": 3      // pesanan dibuat dalam periode, status ≠ batal (basis dasbor pola)
  }
}
```

Aturan:
- `dari` dan `sampai` **wajib**, format `YYYY-MM-DD`, dan `dari ≤ sampai`. Pelanggaran → `400 MASUKAN_TIDAK_SAH`.
- Periode valid tanpa transaksi → angka **nol** dengan `200`, bukan galat.

#### `GET /rekap/menu-terlaris?dari=&sampai=&limit=5`

```jsonc
{
  "data": [
    { "nama": "Ayam Goreng", "jumlahTerjual": 6, "omzet": 42000 },
    { "nama": "Tempe Garit", "jumlahTerjual": 9, "omzet": 18000 }
  ]
}
```
Hanya pesanan dibayar dalam periode. Dikelompokkan berdasarkan **nama salinan** agar menu yang sudah dihapus tetap muncul di rekap. Diurutkan `jumlahTerjual` menurun. `limit` default 5, maksimal 20.

#### `GET /rekap/pola-jam?dari=&sampai=`

Untuk tujuan plan "melihat waktu pesanan masuk sebagai bahan menilai pola penjualan".

```jsonc
{
  "data": [
    { "jam": 11, "jumlahPesanan": 4 },
    { "jam": 12, "jumlahPesanan": 9 }
  ]
}
```
Basis `dibuatPada` dalam WIB, status ≠ `batal`, `data_uji = false`. Jam kosong tidak dikirim.

---

## 6. Rekomendasi kombinasi (integrasi AI)

### 6.1 `POST /rekomendasi`

```jsonc
// permintaan
{
  "nomorMeja": "A01",         // opsional
  "suasanaHati": "sedang",    // nilai final menunggu AI (bagian 9)
  "tingkatPedas": 1,          // 0 | 1 | 2
  "anggaran": 15000           // bilangan bulat Rupiah
}
```

**Validasi (`400 MASUKAN_TIDAK_SAH`):** `suasanaHati` di luar daftar; `tingkatPedas` di luar 0–2; `anggaran` ≤ 0 atau bukan bilangan bulat; semua galat dikembalikan dalam `rincian`.

**Berhasil (`200`):**

```jsonc
{
  "data": {
    "riwayatId": 42,
    "items": [
      { "menuId": "lauk-03", "nama": "Tempe Garit", "harga": 2000, "kategori": "lauk" },
      { "menuId": "sayur-01", "nama": "Sop Bening", "harga": 3000, "kategori": "sayur" }
    ],
    "totalHarga": 5000,       // dihitung ulang server dari harga PostgreSQL
    "alasan": "Cocok untuk suasana sedang dengan pedas tingkat 1 dan anggaran Rp15.000.",
    "sumberModel": "fine-tune"
  }
}
```

**Gagal yang diharapkan (`200`, bukan galat):** katalog dan pemesanan manual tetap jalan.

```jsonc
{
  "data": null,
  "kodeAlasan": "AI_TIDAK_TERSEDIA",
  "alasan": "Rekomendasi sedang tidak tersedia. Silakan pilih menu sendiri."
}
```

| `kodeAlasan` | Kapan | Pesan yang ditampilkan frontend (usulan) |
|---|---|---|
| `AI_TIDAK_TERSEDIA` | layanan AI mati, lambat (> `AI_TIMEOUT_MS`), atau hasil tidak lolos pemeriksaan | "Rekomendasi sedang tidak tersedia. Silakan pilih menu sendiri." |
| `ANGGARAN_TERLALU_RENDAH` | anggaran lebih kecil dari harga menu termurah yang tersedia | "Anggaran Anda terlalu kecil untuk satu porsi pun. Coba naikkan anggaran." |
| `MENU_TIDAK_CUKUP` | menu tersedia tidak cukup membentuk kombinasi lauk + sayur | "Menu yang tersedia sedang terbatas. Silakan pilih menu sendiri." |

### 6.2 Aturan server (wajib)
1. Express meneruskan `suasanaHati`, `tingkatPedas`, `anggaran`, dan daftar menu **yang tersedia** ke FastAPI.
2. Hasil dari FastAPI **diperiksa ulang** di Express: harga diambil dari PostgreSQL, menu `tersedia = false` dibuang, total ≤ anggaran, dan jumlah pedas sesuai batas. Hasil yang gagal pemeriksaan dianggap `AI_TIDAK_TERSEDIA`.
3. **Setiap percobaan** dicatat ke `riwayat_rekomendasi`, termasuk yang gagal (`sumberModel = gagal` dengan `kodeAlasan`). Ini yang memungkinkan uji "periksa riwayatnya di PostgreSQL" dibuktikan.
4. Timeout dikonfigurasi lewat env `AI_TIMEOUT_MS` (usulan 8000). Galat jaringan dan timeout diperlakukan sama.
5. Kunci API dan URL FastAPI hanya di variabel lingkungan server.

---

## 7. Penunjang

| Metode | Path | Akses | Fungsi |
|---|---|---|---|
| `GET` | `/health` | publik | Kesiapan server. Respons: `{ "status": "ok", "database": "ok" }`. Dicek sebelum demonstrasi |
| `POST` | `/auth/login` | publik | Login pemilik. Respons: `{ "data": { "token": "...", "kedaluwarsaPada": "..." } }` |

Mekanisme token ditetapkan di bagian 10 (keputusan #1). Rekomendasi: **Bearer token** di header `Authorization`, bukan cookie, karena frontend (Vercel) dan backend (Render) berada di domain berbeda.

---

## 8. Contoh masukan rekomendasi (bahan tim AI)

| suasanaHati | tingkatPedas | anggaran | Yang diuji |
|---|---|---|---|
| senang | 0 | 10000 | anggaran standar |
| sedang | 1 | 15000 | anggaran standar |
| capek | 2 | 20000 | pedas maksimum |
| sedih | 0 | 6000 | anggaran terbatas (skenario plan) |
| senang | 2 | 2000 | anggaran sangat kecil → `ANGGARAN_TERLALU_RENDAH` (skenario plan) |
| (kosong) | 1 | 15000 | masukan kosong → `400` |
| sedih | 5 | 15000 | pedas di luar rentang → `400` |
| sedih | 1 | -1000 | anggaran negatif → `400` |
| sedang | 1 | 15000 | seluruh menu habis → `AI_TIDAK_TERSEDIA` atau `MENU_TIDAK_CUKUP` |
| sedang | 1 | 15000 | AI dimatikan → `AI_TIDAK_TERSEDIA`, pemesanan manual tetap jalan |

Nilai `suasanaHati` di tabel di atas adalah contoh. Ganti dengan daftar final dari AI.

---

## 9. Kebutuhan dasbor (bahan tim DS)

| Kebutuhan dasbor (plan) | Endpoint | Field |
|---|---|---|
| Pemasukan per periode | `GET /rekap` | `pemasukan` |
| Pengeluaran per periode | `GET /rekap` | `pengeluaran` |
| Saldo arus kas | `GET /rekap` | `saldoArusKas` |
| Jumlah pesanan | `GET /rekap` | `jumlahPesananDibayar`, `jumlahPesananMasuk` |
| Menu terlaris | `GET /rekap/menu-terlaris` | `nama`, `jumlahTerjual`, `omzet` |
| Waktu pesanan masuk | `GET /rekap/pola-jam` | `jam`, `jumlahPesanan` |

Kebutuhan dari tim DS yang **belum dijawab** (tanyakan di sesi kontrak):
- Apakah rekap harian (deret per hari) diperlukan untuk grafik? Bila ya, tambahkan `GET /rekap/harian`.
- Apakah rata-rata nilai pesanan (`pemasukan / jumlahPesananDibayar`) ikut ditampilkan?

---

## 10. Keputusan terbuka

| # | Keputusan | Rekomendasi saya | PIC |
|---|---|---|---|
| 1 | Mekanisme login pemilik | **Bearer token** (JWT, kedaluwarsa 12 jam). Tidak memakai cookie karena domain berbeda | Dhabit + Arya |
| 2 | Nama field JSON | **camelCase** (sudah dipakai dokumen ini; frontend sudah camelCase) | Dhabit + Arya |
| 3 | Daftar `suasanaHati` final | Minimal 5 nilai, dibuat AI dari data DS | Rifki + Wildan |
| 4 | Format id pesanan | **`BE-0001`** dari sekuens server (tidak memakai tanggal di id) | Dhabit + Arya |
| 5 | Batas jumlah per item | **1–50** | Arya |
| 6 | Pagination | Tidak perlu di MVP | Dhabit + Galih |
| 7 | Basis tanggal pemasukan | **tanggal bayar** (`dibayarPada`) | Galih + Mohammad Thalib |
| 8 | Nama field deskripsi menu | **`keteranganRasa`** (sesuai plan) | Dhabit + Arya |
| 9 | Field `porsi` | **Ikut** (wajib dalam plan), nullable | Dhabit + UMKM |
| 10 | Akses publik `GET /pesanan/:id` | **Ringkas** tanpa nama dan catatan (bagian 4.4) | Dhabit + Arya |

---

## 11. Perubahan wajib di frontend (untuk Arya)

Hasil pemeriksaan kode frontend saat ini terhadap kontrak v2:

| Di frontend sekarang | Ganti menjadi | Berkas |
|---|---|---|
| `status: 'diterima'` | `status: 'masuk'` | `features/checkout/types.ts`, `services/order.service.ts` |
| id `BE-${tanggal}-${acak}` dibuat klien | id dari respons server (`BE-0001`) | `services/order.service.ts` |
| `CartItem.itemId` | kirim sebagai `menuId` | `features/checkout/types.ts` |
| `OrderPayload.totalHarga` | hapus dari permintaan (server menghitung) | `features/checkout/types.ts` |
| belum ada `idPermintaan` | buat `crypto.randomUUID()` saat checkout dibuka, simpan sampai pesanan sukses | `CheckoutForm` |
| `MenuItem.deskripsi` | `keteranganRasa` | `types/menu.ts` dan kartu menu |
| belum ada `porsi` | tampilkan `porsi` bila ada | `types/menu.ts` |
| belum ada `tersedia` untuk pesanan | menu habis sudah ditangani di `MenuItemCard` | — |
