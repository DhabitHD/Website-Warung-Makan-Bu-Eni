# Kontrak API `/api/v1/` — Versi 3

> **Status:** DRAFT siap disepakati — target persetujuan **26 Nov 2026** (akhir Minggu 1).
> **Pemilik kontrak:** Dhabit · **Pemakai:** Arya (pembeli & pemilik di frontend), Galih & Mohammad Thalib (dasbor), Rifki & Wildan (rekomendasi).
> **Basis data:** `SKEMA-POSTGRESQL.md` (versi 3). Pemetaan nama JSON ↔ kolom ada di bagian 1.4.
> **Baseline:** `http://localhost:3000/api/v1` (lokal). Produksi mengikuti URL hosting (Render/Railway).
> **Contoh harga** memakai katalog resmi di `Frontend/src/features/menu/services/menu.mock.ts`. Contoh Rp14.500 (Ayam Goreng + Sop Bening) sama dengan contoh di Project Plan.

---

## 0. Ringkasan perubahan

| Perubahan dari v2 | Alasan |
|---|---|
| Contoh harga diperbaiki: Ayam Goreng Rp9.500, Sop Bening Rp5.000 | Reviewer: contoh v2 tidak cocok dengan katalog |
| `nomorMeja` **opsional** di `POST /pesanan` dan `POST /rekomendasi` | Sudah disepakati tim (`?table=` boleh tidak ada). Skema ikut berubah |
| Setiap endpoint diberi **tier** (Inti / Lanjutan / Pelengkap) | Reviewer: pisahkan jalur minimum dari cakupan tambahan |
| Penanganan **race** pada idempotensi (dua permintaan identik bersamaan) | `UNIQUE` saja hanya menolak, belum mengembalikan hasil. Sekarang dibalas `200` dengan pesanan yang menang |
| Pembayaran dan status memakai **kunci optimistik** (`WHERE nilai_lama`) | Reviewer: perubahan pembayaran perlu pengecekan yang sama dengan status |
| Keputusan autentikasi: **token statis** di Inti, login sungguhan di Lanjutan | Reviewer: login butuh pemilik dan waktu. Keputusan dibuat sekarang |

### 0.1 Tier pengerjaan

| Tier | Isi | Target |
|---|---|---|
| **Inti** (target M2) | menu, pesanan (buat, daftar, status, bayar), pengeluaran (catat, lihat), rekap ringkas, token pemilik statis | Minggu 2, selesai **3 Des** (M2 di Project Plan internal) |
| **Lanjutan** | rekomendasi AI, `hargaDiharapkan`, `GET /pesanan/:id` publik, koreksi & hapus pengeluaran, hapus menu, menu terlaris, login sungguhan | Minggu 3, selesai **10 Des** |
| **Pelengkap** | pola jam pesanan masuk, rekap harian | Bila waktu tersisa. Tidak menghalangi demo |

> **Lanjutan bukan berarti boleh dilewati.** Semua indikator wajib plan (termasuk menu terlaris dan rekomendasi) tetap harus jalan sebelum demo. Tier hanya mengatur urutan kerja.

---

## 1. Konvensi umum

### 1.1 Format
- Body berformat **JSON**, karakter **UTF-8**.
- Sukses satu data: `{ "data": { ... } }`. Sukses daftar: `{ "data": [ ... ] }`.
- Tanpa pagination di MVP (volume satu warung kecil). Ditinjau bila data melebihi 1.000 pesanan.

### 1.2 Format galat

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

`rincian` hadir pada galat validasi (`MASUKAN_TIDAK_SAH`), `MENU_HABIS`, dan `HARGA_BERUBAH`.

| Kode | HTTP | Dipakai saat |
|---|---|---|
| `MASUKAN_TIDAK_SAH` | 400 | Zod menolak masukan (kosong, negatif, format salah, tanggal tidak valid) |
| `MENU_HABIS` | 400 | Ada item dengan `tersedia = false`. `rincian` berisi `menuId` yang habis |
| `TANPA_HAK` | 401 | Token tidak ada, salah, atau kedaluwarsa |
| `TIDAK_DITEMUKAN` | 404 | id tidak ada, atau rute salah |
| `KONFLIK` | 409 | Transisi status atau pembayaran tidak diizinkan (lihat bagian 2) |
| `HARGA_BERUBAH` | 409 | Harga server berbeda dengan `hargaDiharapkan`. `rincian` berisi harga terbaru |
| `SERVER` | 500 | Galat tak terduga. Detail hanya di log server |

### 1.3 Aturan wajib
- **Harga dan total dihitung server** dari tabel `menu`. Field `totalHarga` dari klien selalu diabaikan.
- **Uang** berupa integer Rupiah tanpa simbol (`14500`).
- **Waktu** dikirim dalam ISO 8601 UTC (`2026-11-20T07:30:00.000Z`).
- **Periode** (`dari`, `sampai`) format `YYYY-MM-DD`, dihitung dalam zona **Asia/Jakarta**. Tanggal bayar dan tanggal pesan dikonversi ke WIB sebelum dibandingkan.
- Masukan divalidasi **Zod** di Express. Frontend juga memvalidasi, tetapi server yang berwenang.
- `data_uji` **tidak pernah diterima dari klien**. Hanya skrip seed yang mengisinya.

### 1.4 Pemetaan JSON ↔ kolom

Express mengubah `snake_case` (DB) menjadi `camelCase` (JSON). Frontend hanya melihat camelCase.

| JSON | Kolom DB | Catatan |
|---|---|---|
| `id` (menu) | `menu.id` | contoh `lauk-05` |
| `keteranganRasa` | `menu.keterangan_rasa` | frontend sekarang memakai `deskripsi`, harus diganti |
| `porsi` | `menu.porsi` | wajib dalam plan, nullable |
| `tersedia` | `menu.tersedia` | `false` = habis |
| `id` (pesanan) | `pesanan.id` | `BE-0001`, dibuat server |
| `idPermintaan` | `pesanan.id_permintaan` | UUID dari klien |
| `nama` (pesanan) | `pesanan.nama_pelanggan` | dari form checkout |
| `nomorMeja` | `pesanan.nomor_meja` | opsional, `null` bila tidak ada |
| `dibuatPada` | `pesanan.dibuat_pada` | |
| `dibayarPada` | `pesanan.dibayar_pada` | `null` bila belum dibayar |
| `menuId` (item) | `item_pesanan.menu_id` | frontend sekarang memakai `itemId`, harus diganti |
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
| `suasanaHati` | **menunggu daftar final dari AI** (bagian 10) |
| `sumberModel` | `fine-tune`, `llm`, `gagal` |
| `kodeAlasan` | `AI_TIDAK_TERSEDIA`, `ANGGARAN_TERLALU_RENDAH`, `MENU_TIDAK_CUKUP` |

### 2.2 Transisi status pesanan

| Dari | Ke | Diizinkan |
|---|---|---|
| `masuk` | `diproses` | ya |
| `diproses` | `selesai` | ya |
| `masuk` atau `diproses` | `batal` | ya |
| `selesai` atau `batal` | apa pun | **tidak**, `409 KONFLIK` |
| sama dengan status sekarang | — | ya, `200` tanpa perubahan (idempoten) |

### 2.3 Aturan pembayaran

- `belum` → `dibayar`: `dibayarPada` diisi waktu server.
- `dibayar` → `belum`: `dibayarPada` dikosongkan. Dipakai bila pembayaran salah dicatat.
- Pesanan `batal` **tidak boleh** dibayar, `409 KONFLIK`.
- Pesanan `dibayar` **tidak boleh** langsung dibatalkan. Ubah dulu ke `belum`, baru batalkan, `409 KONFLIK`.
- Status `selesai` **tidak** mengubah pemasukan. Pemasukan hanya dihitung dari `pembayaran = dibayar`.

---

## 3. Matriks akses dan tier

| Endpoint | Publik | Pemilik | Tier |
|---|:-:|:-:|---|
| `GET /health` | ✓ | ✓ | Inti |
| `GET /menu`, `GET /menu/:id` | ✓ | ✓ | Inti |
| `POST /pesanan` | ✓ | ✓ | Inti (`hargaDiharapkan` ikut Lanjutan) |
| `GET /pesanan` (daftar) | — | ✓ | Inti |
| `PATCH /pesanan/:id/status` | — | ✓ | Inti |
| `PATCH /pesanan/:id/pembayaran` | — | ✓ | Inti |
| `POST /menu`, `PATCH /menu/:id` | — | ✓ | Inti |
| `POST /pengeluaran`, `GET /pengeluaran` | — | ✓ | Inti |
| `GET /rekap` | — | ✓ | Inti |
| `GET /pesanan/:id` (publik ringkas) | ✓ | ✓ (lengkap) | Lanjutan |
| `DELETE /menu/:id` | — | ✓ | Lanjutan |
| `PATCH /pengeluaran/:id`, `DELETE /pengeluaran/:id` | — | ✓ | Lanjutan |
| `GET /rekap/menu-terlaris` | — | ✓ | Lanjutan |
| `POST /rekomendasi` | ✓ | ✓ | Lanjutan (wajib, selesai 10 Des) |
| `POST /auth/login` | ✓ | — | Lanjutan (Inti memakai token statis, bagian 7) |
| `GET /rekap/pola-jam` | — | ✓ | Pelengkap |

Pengguna tanpa token yang mengakses endpoint pemilik menerima `401 TANPA_HAK` dan tidak mendapat data apa pun.

---

## 4. Katalog dan pesanan (publik)

### 4.1 `GET /menu`

Query opsional: `kategori=lauk|sayur`, `q=kata` (cari nama, tidak peka huruf besar-kecil).

**Penting:** semua menu dikembalikan, termasuk yang habis. Halaman pelanggan menampilkan badge "Habis" dengan tombol nonaktif.

```jsonc
// 200
{
  "data": [
    {
      "id": "lauk-05",
      "nama": "Ayam Goreng",
      "kategori": "lauk",
      "harga": 9500,
      "porsi": null,                  // diisi dari data UMKM
      "foto": "ayamgoreng.jpg",
      "keteranganRasa": null,         // diisi dari data UMKM
      "tersedia": true
    }
  ]
}
```

### 4.2 `GET /menu/:id`
Satu item seperti di atas. `404 TIDAK_DITEMUKAN` bila tidak ada.

### 4.3 `POST /pesanan`

**Permintaan:**

```jsonc
{
  "idPermintaan": "3f6b8e2a-6d1f-4c7e-9a10-2b5f0c9d1e77", // UUID, dibuat frontend saat checkout dibuka
  "nama": "Toni",                                       // 2–60 karakter
  "nomorMeja": "A01",                                   // OPSIONAL. A–Z, a–z, 0–9, '-'; maks 10 karakter
  "catatan": "tanpa sambal",                            // opsional, maks 200 karakter
  "items": [
    { "menuId": "lauk-05", "jumlah": 1 },
    { "menuId": "sayur-07", "jumlah": 1 }
  ]
}
```

**Aturan:**
- `items` minimal satu baris. `jumlah` bilangan bulat **1–50** (usulan).
- `menuId` harus ada di tabel `menu`.
- Item dengan `tersedia = false` → `400 MENU_HABIS`.
- `nomorMeja` boleh tidak dikirim. Pesanan tetap tersimpan dengan `nomorMeja: null`. Pemilik melihat "tanpa meja" di daftar.
- Nama dan harga dari keranjang frontend **tidak dipakai**. Server mengambil dari tabel `menu`.
- *(Lanjutan)* `hargaDiharapkan` per item (opsional). Bila berbeda dengan harga server → `409 HARGA_BERUBAH`.

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
    "totalHarga": 14500,
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "dibayarPada": null,
    "items": [
      { "menuId": "lauk-05", "nama": "Ayam Goreng", "harga": 9500, "jumlah": 1, "subtotal": 9500 },
      { "menuId": "sayur-07", "nama": "Sop Bening", "harga": 5000, "jumlah": 1, "subtotal": 5000 }
    ]
  }
}
```

**Idempotensi.** Bila `idPermintaan` yang sama dikirim lagi (retry jaringan, refresh, atau tombol ditekan dua kali), server mengembalikan pesanan yang sudah ada dengan **`200`**, tanpa membuat pesanan baru dan tanpa memvalidasi ulang isi permintaan.

**Dua permintaan identik bersamaan.** Keduanya bisa lolos pemeriksaan awal. Yang kalah akan gagal di `UNIQUE`, dan server **tidak** membalas galat. Server mengambil pesanan yang menang dan membalasnya dengan `200`. Rinciannya di `SKEMA-POSTGRESQL.md` bagian 4.1.

**Galat `HARGA_BERUBAH` (`409`, Lanjutan):**

```jsonc
{
  "galat": {
    "kode": "HARGA_BERUBAH",
    "pesan": "Ada harga yang berubah. Periksa pesanan Anda sebelum mengirim.",
    "rincian": [
      { "menuId": "lauk-05", "hargaDiharapkan": 9500, "hargaTerkini": 10000 }
    ]
  }
}
```

Frontend menampilkan harga baru dan memperbarui keranjang. Pembeli menekan kirim lagi setelah melihatnya. Ini memenuhi skenario uji plan "pembeli menerima pemberitahuan sebelum melanjutkan pesanan".

### 4.4 `GET /pesanan/:id` (publik ringkas, Lanjutan)

Dipakai halaman konfirmasi. Respons publik **tidak** memuat `nama` dan `catatan` agar data pelanggan terlindungi.

```jsonc
{
  "data": {
    "id": "BE-0001",
    "nomorMeja": "A01",
    "status": "masuk",
    "pembayaran": "belum",
    "totalHarga": 14500,
    "dibuatPada": "2026-11-20T07:30:00.000Z",
    "items": [ { "nama": "Ayam Goreng", "jumlah": 1, "subtotal": 9500 } ]
  }
}
```

---

## 5. Pengelolaan pemilik (butuh token)

### 5.1 `GET /pesanan` (Inti)
Query opsional: `status`, `pembayaran`, `dari`, `sampai` (filter `dibuatPada`, dihitung dalam WIB). Urutan terbaru dulu. Memuat field lengkap termasuk `nama` dan `catatan`.

### 5.2 `GET /pesanan/:id` (pemilik)
Versi lengkap dari 4.4.

### 5.3 `PATCH /pesanan/:id/status` (Inti)

```jsonc
// permintaan
{ "status": "diproses" }
// 200 — status baru. Aturan di bagian 2.2.
// 409 KONFLIK — transisi tidak diizinkan.
```

Pembaruan memakai **kunci optimistik**: `UPDATE … WHERE id = $1 AND status = $statusLama`. Bila tidak ada baris yang berubah, server membaca ulang pesanan:
- status sudah sama dengan yang diminta → `200` (idempoten);
- status berbeda dan transisi tidak sah → `409 KONFLIK`.

### 5.4 `PATCH /pesanan/:id/pembayaran` (Inti)

```jsonc
// permintaan
{ "pembayaran": "dibayar" }
// 200 — dibayarPada terisi waktu server.
// Mengirim "dibayar" lagi → 200, dibayarPada tidak berubah.
// 409 KONFLIK — pesanan batal, atau pesanan dibayar akan dibatalkan (bagian 2.3).
```

Pembaruan juga memakai **kunci optimistik**: `UPDATE … WHERE id = $1 AND pembayaran = $pembayaranLama AND status <> 'batal'`. Logika balasan sama dengan 5.3. Constraint di database (`pesanan_batal_tidak_dibayar`) tetap menjadi penjaga terakhir.

### 5.5 Menu (Inti: `POST`, `PATCH`; Lanjutan: `DELETE`)

| Metode | Path | Fungsi |
|---|---|---|
| `POST` | `/menu` | Tambah menu. Body seperti 4.1 tanpa `id` (server membuat `id`) |
| `PATCH` | `/menu/:id` | Ubah sebagian field, termasuk `tersedia` untuk menandai habis |
| `DELETE` | `/menu/:id` | Hapus menu. Riwayat pesanan tetap utuh karena nama dan harga sudah disalin |

Validasi (sesuai form admin): `nama` 2–60 karakter, `harga` bilangan bulat 0–10.000.000, `kategori` salah satu dari dua nilai, `foto` wajib, `keteranganRasa` maks 200 karakter.

### 5.6 Pengeluaran

| Metode | Path | Tier | Fungsi |
|---|---|---|---|
| `POST` | `/pengeluaran` | Inti | Catat pengeluaran |
| `GET` | `/pengeluaran` | Inti | Daftar, query `dari`, `sampai` |
| `PATCH` | `/pengeluaran/:id` | Lanjutan | Koreksi nominal, tanggal, atau keterangan |
| `DELETE` | `/pengeluaran/:id` | Lanjutan | Hapus catatan yang salah |

```jsonc
// POST /pengeluaran — permintaan
{ "keterangan": "Beli bahan baku", "nominal": 150000, "tanggal": "2026-12-03" }
// 201 — tersimpan. Nominal ≤ 0, bukan angka, atau tanggal tidak valid → 400 dengan rincian.
```

Tanggal tidak boleh di masa depan. Pemeriksaan dilakukan di Zod, bukan di database (lihat skema 3.5).

### 5.7 Rekap dan dasbor

Semua rekap memakai aturan yang sama: **hanya** `pembayaran = dibayar` dan `data_uji = false` yang masuk pemasukan. Periode memakai tanggal **pembayaran** (`dibayarPada`, WIB), bukan tanggal pesanan dibuat.

#### `GET /rekap?dari=2026-12-01&sampai=2026-12-31` (Inti)

```jsonc
{
  "data": {
    "periode": { "dari": "2026-12-01", "sampai": "2026-12-31" },
    "pemasukan": 22000,          // total pesanan dibayar dalam periode (14500 + 7500)
    "pengeluaran": 5000,         // total nominal pengeluaran dalam periode
    "saldoArusKas": 17000,       // pemasukan − pengeluaran. BUKAN laba bersih
    "jumlahPesananDibayar": 2,   // basis pemasukan
    "jumlahPesananMasuk": 3      // pesanan dibuat dalam periode, status ≠ batal
  }
}
```

- `dari` dan `sampai` **wajib**, format `YYYY-MM-DD`, dan `dari ≤ sampai`. Pelanggaran → `400 MASUKAN_TIDAK_SAH`.
- Periode tanpa transaksi → angka **nol** dengan `200`, bukan galat.

#### `GET /rekap/menu-terlaris?dari=&sampai=&limit=5` (Lanjutan)

```jsonc
{
  "data": [
    { "nama": "Tempe Garit", "jumlahTerjual": 9, "omzet": 18000 },
    { "nama": "Ayam Goreng", "jumlahTerjual": 3, "omzet": 28500 }
  ]
}
```
Hanya pesanan dibayar dalam periode. Dikelompokkan per **nama salinan** agar menu yang sudah dihapus tetap muncul. Diurutkan `jumlahTerjual` menurun. `limit` default 5, maksimum 20.

#### `GET /rekap/pola-jam?dari=&sampai=` (Pelengkap)

```jsonc
{
  "data": [
    { "jam": 11, "jumlahPesanan": 4 },
    { "jam": 12, "jumlahPesanan": 9 }
  ]
}
```
Basis `dibuatPada` (WIB), status ≠ `batal`, `data_uji = false`. Jam tanpa pesanan tidak dikirim.

---

## 6. Rekomendasi kombinasi (integrasi AI, Lanjutan)

### 6.1 `POST /rekomendasi`

```jsonc
// permintaan
{
  "nomorMeja": "A01",         // opsional
  "suasanaHati": "sedang",    // nilai final menunggu AI (bagian 10)
  "tingkatPedas": 1,          // 0 | 1 | 2
  "anggaran": 15000           // bilangan bulat Rupiah
}
```

**Validasi (`400 MASUKAN_TIDAK_SAH`):** `suasanaHati` di luar daftar, `tingkatPedas` di luar 0–2, `anggaran` ≤ 0 atau bukan bilangan bulat. Semua galat dikembalikan dalam `rincian`.

**Berhasil (`200`):**

```jsonc
{
  "data": {
    "riwayatId": 42,
    "items": [
      { "menuId": "lauk-02", "nama": "Tempe Garit", "harga": 2000, "kategori": "lauk" },
      { "menuId": "sayur-07", "nama": "Sop Bening", "harga": 5000, "kategori": "sayur" }
    ],
    "totalHarga": 7000,       // dihitung ulang server dari harga PostgreSQL
    "alasan": "Cocok untuk suasana sedang dengan pedas tingkat 1 dan anggaran Rp15.000.",
    "sumberModel": "fine-tune"
  }
}
```

**Gagal (`200`, bukan galat).** Katalog dan pemesanan manual tetap berjalan.

```jsonc
{
  "data": null,
  "kodeAlasan": "AI_TIDAK_TERSEDIA",
  "alasan": "Rekomendasi sedang tidak tersedia. Silakan pilih menu sendiri."
}
```

| `kodeAlasan` | Kapan | Pesan usulan untuk pembeli |
|---|---|---|
| `AI_TIDAK_TERSEDIA` | layanan AI mati, lambat (> `AI_TIMEOUT_MS`), atau hasil tidak lolos pemeriksaan | "Rekomendasi sedang tidak tersedia. Silakan pilih menu sendiri." |
| `ANGGARAN_TERLALU_RENDAH` | anggaran lebih kecil dari harga menu termurah yang tersedia | "Anggaran Anda terlalu kecil untuk satu porsi. Coba naikkan anggaran." |
| `MENU_TIDAK_CUKUP` | menu tersedia tidak cukup untuk membentuk kombinasi lauk dan sayur | "Menu yang tersedia sedang terbatas. Silakan pilih menu sendiri." |

### 6.2 Aturan server (wajib)
1. Express meneruskan `suasanaHati`, `tingkatPedas`, `anggaran`, dan daftar menu **yang tersedia** ke FastAPI.
2. Hasil FastAPI **diperiksa ulang** di Express: harga dari PostgreSQL, menu `tersedia = false` dibuang, total ≤ anggaran, dan tingkat pedas sesuai. Hasil yang gagal pemeriksaan diperlakukan sebagai `AI_TIDAK_TERSEDIA`.
3. **Setiap percobaan** dicatat ke `riwayat_rekomendasi`, termasuk yang gagal (`sumberModel = gagal` dengan `kodeAlasan`). Ini yang membuat uji "periksa riwayatnya di PostgreSQL" bisa dibuktikan.
4. Timeout diatur lewat env `AI_TIMEOUT_MS` (usulan 8000). Galat jaringan dan timeout diperlakukan sama.
5. Kunci API dan URL FastAPI hanya di variabel lingkungan server.

---

## 7. Autentikasi pemilik

Plan tidak menjadwalkan login, tetapi plan mewajibkan halaman pemilik tidak bisa diakses pihak tak berwenang (Risiko E). Keputusan:

| Tahap | Mekanisme | Keterangan |
|---|---|---|
| **Inti (M2)** | **Token statis** di env `PEMILIK_TOKEN`, dikirim sebagai `Authorization: Bearer <token>` | Satu pemilik, satu token. Token tidak disimpan di repositori. Diganti bila pernah bocor |
| **Lanjutan** | `POST /auth/login` dengan username dan password (hash bcrypt), balasan token JWT kedaluwarsa 12 jam | Dikerjakan minggu 3. Frontend mengganti halaman login mock dengan login ini |

**Mengapa Bearer, bukan cookie:** frontend (Vercel) dan backend (Render) berada di domain berbeda, sehingga cookie lintas-situs rumit.

Di Lanjutan, respons login:

```jsonc
// POST /auth/login — permintaan
{ "username": "bu-eni", "password": "••••••" }
// 200
{ "data": { "token": "eyJ...", "kedaluwarsaPada": "2026-12-04T12:00:00.000Z" } }
// 401 TANPA_HAK — kredensial salah
```

---

## 8. Penunjang

| Metode | Path | Akses | Fungsi |
|---|---|---|---|
| `GET` | `/health` | publik | Kesiapan server. Respons: `{ "status": "ok", "database": "belum_dihubungkan" }`. Nilai `database` menjadi `ok` atau `gagal` setelah Tahap 2. Dicek sebelum demo |

---

## 9. Contoh masukan rekomendasi (bahan tim AI)

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

Nilai `suasanaHati` di atas adalah contoh. Gantilah dengan daftar final dari AI.

---

## 10. Kebutuhan dasbor (bahan tim DS)

| Kebutuhan dasbor (plan) | Endpoint | Field | Tier |
|---|---|---|---|
| Pemasukan per periode | `GET /rekap` | `pemasukan` | Inti |
| Pengeluaran per periode | `GET /rekap` | `pengeluaran` | Inti |
| Saldo arus kas | `GET /rekap` | `saldoArusKas` | Inti |
| Jumlah pesanan | `GET /rekap` | `jumlahPesananDibayar`, `jumlahPesananMasuk` | Inti |
| Menu terlaris | `GET /rekap/menu-terlaris` | `nama`, `jumlahTerjual`, `omzet` | Lanjutan |
| Waktu pesanan masuk | `GET /rekap/pola-jam` | `jam`, `jumlahPesanan` | Pelengkap |

Pertanyaan DS yang belum dijawab:
- Apakah grafik harian diperlukan? Bila ya, tambahkan `GET /rekap/harian` di tier Pelengkap.
- Apakah rata-rata nilai pesanan (`pemasukan / jumlahPesananDibayar`) perlu ditampilkan?

---

## 11. Keputusan terbuka

| # | Keputusan | Rekomendasi saya | PIC |
|---|---|---|---|
| 1 | Autentikasi | **Token statis di Inti**, login sungguhan di Lanjutan (bagian 7) | Dhabit + Arya |
| 2 | Nama field JSON | **camelCase** | Dhabit + Arya |
| 3 | Daftar `suasanaHati` | Minimal 5 nilai, dibuat AI dari data DS | Rifki + Wildan |
| 4 | Format id pesanan | **`BE-0001`** dari sekuens server | Dhabit + Arya |
| 5 | Batas jumlah per item | **1–50** | Arya |
| 6 | Pagination | Tidak perlu di MVP | Dhabit + Galih |
| 7 | Basis tanggal pemasukan | **tanggal bayar** (`dibayarPada`) | Galih + Mohammad Thalib |
| 8 | Nama field deskripsi menu | **`keteranganRasa`** | Dhabit + Arya |
| 9 | Field `porsi` | **Ikut**, nullable. Isi dari UMKM | Dhabit + UMKM |
| 10 | Akses publik `GET /pesanan/:id` | **Ringkas**, tanpa nama dan catatan | Dhabit + Arya |
| 11 | `nomorMeja` wajib atau opsional | **Opsional** di API, sesuai kesepakatan tim. Form checkout frontend masih mewajibkannya, perlu diputuskan Arya | Arya + Dhabit |

---

## 12. Perubahan wajib di frontend (untuk Arya)

| Di frontend sekarang | Ganti menjadi | Berkas |
|---|---|---|
| `status: 'diterima'` | `status: 'masuk'` | `features/checkout/types.ts`, `services/order.service.ts` |
| id `BE-${tanggal}-${acak}` dibuat klien | id dari respons server (`BE-0001`) | `services/order.service.ts` |
| `CartItem.itemId` | kirim sebagai `menuId` | `features/checkout/types.ts` |
| `OrderPayload.totalHarga` | hapus dari permintaan (server menghitung) | `features/checkout/types.ts` |
| belum ada `idPermintaan` | `crypto.randomUUID()` saat checkout dibuka, disimpan sampai pesanan sukses | `CheckoutForm` |
| `MenuItem.deskripsi` | `keteranganRasa` | `types/menu.ts`, kartu menu |
| belum ada `porsi` | tampilkan bila ada | `types/menu.ts` |
| `checkoutSchema.nomorMeja` wajib | menunggu keputusan #11 | `features/checkout/schemas/checkout.ts` |
