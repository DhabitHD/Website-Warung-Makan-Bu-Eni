# Wireframe — Warung Makan Bu Eni

> **Status:** Draf Minggu 1 (Dhabit). Gambaran tata letak dan kondisi tiap halaman, bukan desain visual akhir.
> **Acuan:** `Backend/docs/KONTRAK-API.md` (kontrak v3) untuk bentuk data. `docs/STANDARDS.md` untuk rute dan komponen.
> **Label:** setiap label yang bergantung pada keputusan tim ditandai **(keputusan K…)**.

---

## 0. Cara membaca

- **Ada** = rute sudah ada di kode. **Usulan** = belum ada rutenya, perlu disetujui dulu.
- Setiap halaman digambar untuk dua lebar yang disyaratkan plan:
  - **Ponsel:** 360–414 px
  - **Komputer:** ≥ 1280 px
- Kotak `[ ]` = tombol. `( )` = input. `{ }` = elemen dinamis dari data.
- Aturan umum untuk semua halaman:
  - Target sentuh minimum 44 px.
  - Tidak ada gulir mendatar.
  - Teks utama selalu terbaca di 360 px.

---

## 1. Peta rute

| Rute | Halaman | Siapa | Status |
|---|---|---|---|
| `/` | redirect ke `/menu` | pembeli | ada |
| `/menu` | katalog menu, cari, filter, rekomendasi | pembeli | ada |
| `/cart` | keranjang | pembeli | ada |
| `/checkout` | form pesan dan ringkasan | pembeli | ada |
| `/order-success` | konfirmasi pesanan | pembeli | ada |
| `/admin/login` | login pemilik | pemilik | ada |
| `/admin` | dashboard ringkasan | pemilik | ada (placeholder) |
| `/admin/menu` | kelola menu | pemilik | ada |
| `/admin/menu/baru` | tambah menu | pemilik | ada |
| `/admin/menu/:id/edit` | ubah menu | pemilik | ada |
| `/admin/pesanan` | daftar pesanan | pemilik | ada (placeholder) |
| `/admin/pesanan/:id` | detail pesanan | pemilik | ada (placeholder) |
| `/admin/riwayat` | riwayat pesanan selesai dan batal | pemilik | ada (placeholder) |
| `/admin/keuangan` | rekap periode dan daftar pengeluaran | pemilik | **usulan** |
| `/admin/pengeluaran/baru` | catat pengeluaran | pemilik | **usulan** |
| rekomendasi | panel di `/menu` (bottom sheet di ponsel) | pembeli | **usulan**, tanpa rute baru |

> **Usulan rekomendasi tanpa rute:** karena rekomendasi adalah langkah tambahan dari katalog, saya usul panel di `/menu`. Bila tim memilih rute terpisah, tambahkan `/rekomendasi` di tabel ini.

---

## 2. Pembeli

### 2.1 `/menu` — katalog (ada)

**Ponsel (360 px)**

```
┌──────────────────────────────┐
│ Warung Makan Bu Eni   [meja] │  ← sticky, h-14
├──────────────────────────────┤
│ Daftar menu            18    │
│ ( Cari menu…           🔍 )  │
│ [Semua] [Lauk] [Sayur]       │  ← chip, sticky
├──────────────────────────────┤
│ 01 / Lauk              11    │
│ ┌──────────┐ ┌──────────┐    │
│ │ foto     │ │ foto     │    │
│ │ Gorengan │ │ Tempe…   │    │
│ │ Rp1.500  │ │ Rp2.000  │    │
│ │[+ Tambah]│ │[+ Tambah]│    │
│ └──────────┘ └──────────┘    │
│ …                            │
├──────────────────────────────┤
│ [ ✨ Minta rekomendasi ]      │  ← usulan, di atas CartBar
│ ░ 3 item · Rp9.500  [Lihat ›] │  ← CartBar, muncul bila keranjang terisi
└──────────────────────────────┘
```

**Komputer (≥ 1280 px):** katalog 2–3 kolom kartu di kiri. Panel "Pesananmu" di kanan (`OrderSummaryCard`), berisi item, total, dan tombol "Lihat keranjang".

**Kartu menu**

```
┌──────────────────────┐
│ foto                 │
│ Ayam Goreng  [Habis] │  ← badge bila tersedia = false
│ Rp9.500              │
│ 1 potong · (porsi)   │  ← porsi: null → sembunyikan baris (keputusan K9)
│ Gurih, bumbu ungkep  │  ← keteranganRasa: null → sembunyikan (keputusan K8)
│ [+ Tambah]           │  ← disabled + teks "Habis" bila tersedia = false
└──────────────────────┘
```

**Kondisi**

| Kondisi | Tampilan |
|---|---|
| Pencarian tanpa hasil | `EmptyState`: "Menu tidak ditemukan" + kata kunci |
| Filter kosong (mis. sayur habis semua) | `EmptyState` dengan tombol "Tampilkan semua" |
| Gagal memuat (usulan saat API aktif) | banner galat + tombol "Coba lagi" |
| Semua menu habis | banner di atas daftar, tombol tambah nonaktif |

---

### 2.2 Panel rekomendasi — usulan (di `/menu`)

**Ponsel:** bottom sheet setinggi ±85% layar.

```
┌──────────────────────────────┐
│ Rekomendasi kombinasi    [×] │
├──────────────────────────────┤
│ Suasana hati                 │
│ (senang)(sedang)(capek)      │  ← daftar final dari AI (keputusan K9)
│ (sedih)(…)                   │
│                              │
│ Pedas                        │
│ [0 tidak] [1 sedang] [2 pedas]│
│                              │
│ Anggaran (Rp)                │
│ ( 15000                    ) │  ← integer > 0; negatif ditolak
│                              │
│ [ Cari kombinasi ]           │
└──────────────────────────────┘
```

**Hasil sukses**

```
┌──────────────────────────────┐
│ Cocok untuk suasana sedang   │  ← alasan (dari server)
│ dengan pedas tingkat 1       │
├──────────────────────────────┤
│ Tempe Garit        Rp2.000   │
│ Sop Bening         Rp5.000   │
├──────────────────────────────┤
│ Total              Rp7.000   │
│ [Tambah semua ke keranjang]  │
│ [Ubah pilihan]               │
└──────────────────────────────┘
```

**Hasil gagal** (`data: null`, pemesanan manual tetap jalan)

| `kodeAlasan` | Tampilan |
|---|---|
| `AI_TIDAK_TERSEDIA` | "Rekomendasi sedang tidak tersedia. Silakan pilih menu sendiri." + tombol tutup |
| `ANGGARAN_TERLALU_RENDAH` | "Anggaran Anda terlalu kecil untuk satu porsi. Coba naikkan anggaran." + fokus ke input anggaran |
| `MENU_TIDAK_CUKUP` | "Menu yang tersedia sedang terbatas. Silakan pilih menu sendiri." |

**Masukan salah** (dari `MASUKAN_TIDAK_SAH`): pesan di bawah field yang salah, tidak ada permintaan ke server sebelum lolos validasi Zod.

---

### 2.3 `/cart` — keranjang (ada)

**Ponsel**

```
┌──────────────────────────────┐
│ ‹ Kembali      Keranjang     │
├──────────────────────────────┤
│ Gorengan            Rp1.500  │
│ [−] 2 [+]          Rp3.000   │
│ [Hapus]                      │
│ ─────────────────────────── │
│ Sop Bening          Rp5.000  │
│ [−] 1 [+]          Rp5.000   │
│ [Hapus]                      │
├──────────────────────────────┤
│ Total sementara     Rp8.000  │
│ [ Lanjut ke pesan ›        ] │  ← sticky di bawah
└──────────────────────────────┘
```

**Kondisi**

| Kondisi | Tampilan |
|---|---|
| Keranjang kosong | `EmptyState` "Belum ada pilihan. Tambah lauk atau sayur dulu, ya." + tombol ke `/menu` |
| Jumlah diubah ke 0 | item dihapus (bukan galat) |
| Jumlah > 50 (keputusan K14) | stepper berhenti di 50 dengan teks kecil "Maksimal 50 per menu" |
| Menu sudah habis saat dibuka (usulan saat API aktif) | item tetap tampil dengan badge "Habis"; tombol lanjut tetap aktif tapi checkout menolak (lihat 2.4) |

---

### 2.4 `/checkout` — pesan (ada)

**Ponsel**

```
┌──────────────────────────────┐
│ ‹ Kembali      Pesan         │
├──────────────────────────────┤
│ Nama                         │
│ ( Nama kamu                ) │  ← 2–60 karakter
│                              │
│ Nomor meja                   │
│ ( A01                      ) │  ← opsional (keputusan K11), A–Z, 0–9, '-'
│                              │
│ Catatan (opsional)           │
│ ( tanpa sambal             ) │  ← maks 200
├──────────────────────────────┤
│ Pesananmu                    │
│ Gorengan ×2          Rp3.000 │
│ Sop Bening ×1        Rp5.000 │
│ Total                Rp8.000 │
├──────────────────────────────┤
│ [ Kirim pesanan ]            │  ← disabled saat mengirim
└──────────────────────────────┘
```

**Kondisi**

| Kondisi | Tampilan |
|---|---|
| Masukan salah | pesan di bawah field. Fokus ke field pertama yang salah |
| Sedang mengirim | tombol disabled + teks "Mengirim…"; tidak bisa dikirim dua kali |
| Menu habis (`MENU_HABIS`) | banner merah: "[Nama] baru saja habis." Item disorot. Pembeli kembali ke keranjang |
| Harga berubah (`HARGA_BERUBAH`) | banner kuning: "Ada harga yang berubah." Tampilkan harga lama → baru per item. Keranjang diperbarui. Pembeli menekan kirim lagi |
| Keranjang kosong | halaman diarahkan ke `/cart` dengan pesan kosong |
| Galat jaringan | banner "Pesanan belum terkirim. Coba lagi." Data form tetap terisi |

**Catatan K11:** bila nomor meja diwajibkan, label menjadi "Nomor meja" tanpa "(opsional)" dan validasi `min(1)`. Bila opsional, tampilkan teks kecil "Kosongkan bila tidak ada meja".

---

### 2.5 `/order-success` — konfirmasi (ada)

```
┌──────────────────────────────┐
│           ✓                  │
│  Pesanan kamu sudah masuk    │
│                              │
│  Nomor pesanan    BE-0001    │  ← dari server, bukan klien
│  Meja             A01        │
│  Total            Rp8.000    │
│  Status           Masuk      │  ← label dari status masuk
│                              │
│  Silakan bayar di kasir      │  ← teks statis, sesuai alur UMKM
│  setelah pesanan disiapkan.  │
│                              │
│  [ Pesan lagi ]              │
└──────────────────────────────┘
```

**Kondisi:** pesanan tidak ditemukan (sesi hilang) → `EmptyState` + tombol ke `/menu`. Tampilan ini tidak menampilkan nama pelanggan (konsisten dengan kontrak 4.4).

---

## 3. Pemilik

### 3.1 `/admin/login` (ada)

```
┌──────────────────────────────┐
│ Warung Makan Bu Eni          │
│ DASHBOARD ADMIN              │
│                              │
│ Login admin                  │
│ ( Username                 ) │
│ ( Password                 ) │
│ [ Masuk ]                    │
│                              │
│ (akun demo)                  │  ← hanya mode pengembangan
└──────────────────────────────┘
```

**Kondisi:** kredensial salah → banner galat di atas form. Setelah tahap token statis (kontrak §7), form diganti input token atau login sungguhan (keputusan K1).

---

### 3.2 `/admin` — dashboard (ada, placeholder)

**Ponsel**

```
┌──────────────────────────────┐
│ ☰ Warung Makan Bu Eni ADMIN  │  ← bilah atas, h-14
├──────────────────────────────┤
│ Hari ini (periode aktif)     │
│ [ Pemasukan   Rp22.000 ]     │  ← kartu StatCard
│ [ Pengeluaran  Rp5.000 ]     │
│ [ Saldo kas   Rp17.000 ]     │
│ [ Pesanan dibayar   2  ]     │
│ [ Pesanan masuk     3  ]     │
├──────────────────────────────┤
│ Menu terlaris                │
│ 1. Tempe Garit   ×9  Rp18k   │  ← /rekap/menu-terlaris
│ 2. Ayam Goreng   ×3  Rp28,5k │
├──────────────────────────────┤
│ Pola jam (usulan Pelengkap)  │
│ ▂▄▇▃ grafik batang per jam   │
└──────────────────────────────┘
```

**Komputer:** kartu statistik 4 kolom di atas, menu terlaris dan pola jam berdampingan di bawah.

**Filter periode:** dropdown "Hari ini / 7 hari / Bulan ini / Pilih tanggal" di kanan atas. Semua angka mengikuti filter. Dibaca dari `/rekap?dari=&sampai=` (zona WIB).

**Kondisi:** periode kosong → semua angka nol, bukan galat. Label saldo: **"Saldo arus kas (bukan laba)"**.

---

### 3.3 `/admin/menu` — kelola menu (ada)

**Ponsel:** kartu per menu (nama, kategori, harga, toggle ketersediaan, ubah, hapus). Di atas: tombol "+ Tambah menu", filter kategori, pencarian.

**Komputer:** tabel dengan kolom Menu, Kategori, Harga, Status, Aksi.

| Aksi | Perilaku |
|---|---|
| Toggle "Tersedia / Habis" | langsung `PATCH /menu/:id`; badge berubah |
| Hapus | konfirmasi sebaris "Hapus menu ini?" lalu `DELETE` (tier Lanjutan) |
| Ubah | ke `/admin/menu/:id/edit` |

**Kondisi:** daftar kosong → `EmptyState` + tombol "Tambah menu pertama".

---

### 3.4 `/admin/menu/baru` dan `/admin/menu/:id/edit` (ada)

```
┌──────────────────────────────┐
│ ‹ Kelola Menu                │
│ Tambah menu baru             │
│                              │
│ Nama menu                    │
│ ( Tempe Garit              ) │  ← 2–60
│ Kategori  ( Lauk ▾ )         │
│ Harga (Rp)                   │
│ ( 2000                     ) │  ← bilangan bulat 0–10 juta
│ Nama file foto               │
│ ( tempegarit.jpg           ) │
│ Porsi (opsional)             │  ← keputusan K9
│ ( 1 potong                 ) │
│ Keterangan rasa (opsional)   │  ← keputusan K8, maks 200
│ ( …                        ) │
│ [x] Tersedia dijual          │
│ [ Batal ] [ Simpan ]         │
└──────────────────────────────┘
```

**Kondisi:** masukan salah → pesan di bawah field. Ubah menu yang tidak ada → `EmptyState` "Menu tidak ditemukan" + kembali.

---

### 3.5 `/admin/pesanan` — daftar pesanan (ada, placeholder)

**Ponsel**

```
┌──────────────────────────────┐
│ ☰ … ADMIN                    │
│ Pesanan                      │
│ [Semua][Masuk][Diproses]…    │  ← chip status (mendatar, bisa digeser)
│ [Belum bayar ▾]              │
├──────────────────────────────┤
│ BE-0003          14:20       │
│ Budi · Meja C03              │
│ Rp3.000 · [Masuk] [Belum]    │
│ ─────────────────────────── │
│ BE-0002          13:05       │
│ Sari · Meja B02              │
│ Rp7.500 · [Masuk] [Dibayar]  │
└──────────────────────────────┘
```

**Komputer:** tabel dengan kolom Nomor, Waktu, Nama, Meja, Total, Status, Pembayaran. Baris bisa diklik ke detail.

**Kondisi:** tanpa pesanan → `EmptyState` "Belum ada pesanan masuk". Data diperbarui manual (tombol "Muat ulang") pada MVP.

**Label status (usulan, perlu disetujui bersama label di kontrak):** masuk → "Masuk"; diproses → "Diproses"; selesai → "Selesai"; batal → "Batal". Pembayaran: belum → "Belum dibayar"; dibayar → "Sudah dibayar".

---

### 3.6 `/admin/pesanan/:id` — detail (ada, placeholder)

```
┌──────────────────────────────┐
│ ‹ Pesanan                    │
│ BE-0002                      │
│ Sari · Meja B02 · 13:05      │
│ Catatan: tanpa sambal        │
├──────────────────────────────┤
│ Gorengan ×2          Rp3.000 │
│ Sop Bening ×1        Rp5.000 │
│ Total                Rp8.000 │
├──────────────────────────────┤
│ Status                       │
│ [Masuk ▾] → [Diproses]       │  ← dropdown hanya transisi yang sah
│ Pembayaran                   │
│ [ Tandai sudah dibayar ]     │
└──────────────────────────────┘
```

**Aturan tampilan (dari kontrak §2):**
- Status `selesai` dan `batal` → dropdown terkunci, teks "Pesanan sudah selesai".
- Pesanan `batal` → tombol bayar disembunyikan.
- Pesanan `dibayar` → opsi "Batalkan" tidak tersedia. Muncul teks "Ubah pembayaran ke belum dulu untuk membatalkan." Dengan tombol "Kembalikan ke belum".
- Pesanan `dibayar` → tombol berubah menjadi "Sudah dibayar ✓" (nonaktif kecuali kembali ke belum).

**Kondisi galat:**
- `KONFLIK` dengan pesan spesifik → tampilkan pesan dari server apa adanya.
- Pesanan tidak ditemukan → `EmptyState` + kembali.

---

### 3.7 `/admin/riwayat` — riwayat (ada, placeholder)

Daftar pesanan berstatus `selesai` dan `batal`, urut terbaru. Filter tanggal. Komputer: tabel. Ponsel: kartu. Tombol ekspor ditunda (di luar cakupan plan).

---

### 3.8 `/admin/keuangan` — rekap dan pengeluaran (usulan)

**Ponsel**

```
┌──────────────────────────────┐
│ ‹ Dashboard   Keuangan       │
│ Periode                      │
│ ( 1 Des 2026 ) s/d ( 31 Des )│  ← dari ≤ sampai, wajib
│ [ Tampilkan ]                │
├──────────────────────────────┤
│ Pemasukan (pesanan dibayar)  │
│ Rp22.000                     │
│ Pengeluaran                  │
│ Rp5.000                      │
│ Saldo arus kas               │
│ Rp17.000                     │
│ (bukan laba bersih)          │
├──────────────────────────────┤
│ Pengeluaran                  │
│ 3 Des · Beli bahan baku      │
│ Rp5.000   [Ubah] [Hapus]     │
│ [ + Catat pengeluaran ]      │
└──────────────────────────────┘
```

**Kondisi:**
- Tanggal tidak lengkap atau `dari > sampai` → pesan di bawah field, tidak ada permintaan.
- Periode tanpa transaksi → angka nol, daftar pengeluaran kosong dengan `EmptyState`.

---

### 3.9 `/admin/pengeluaran/baru` — catat pengeluaran (usulan)

```
┌──────────────────────────────┐
│ ‹ Keuangan                   │
│ Catat pengeluaran            │
│ Keterangan                   │
│ ( Beli bahan baku          ) │  ← 2–120
│ Nominal (Rp)                 │
│ ( 150000                   ) │  ← 1 – 100.000.000
│ Tanggal                      │
│ ( 2026-12-03               ) │  ← tidak boleh di masa depan
│ [ Batal ] [ Simpan ]         │
└──────────────────────────────┘
```

**Kondisi:** nominal nol, negatif, atau bukan angka → pesan di bawah field. Tanggal di masa depan → "Tanggal tidak boleh di masa depan."

---

## 4. Data yang dibutuhkan tiap halaman

| Halaman | Sumber (kontrak v3) |
|---|---|
| `/menu`, kartu menu | `GET /menu` (semua menu, termasuk habis) |
| `/cart` | state lokal keranjang. Harga disalin dari `GET /menu` saat ditambahkan |
| `/checkout` | `POST /pesanan` (`idPermintaan` dibuat saat halaman dibuka) |
| `/order-success` | respons `POST /pesanan` (sesi), atau `GET /pesanan/:id` (publik ringkas) |
| Panel rekomendasi | `POST /rekomendasi` |
| `/admin` | `GET /rekap`, `GET /rekap/menu-terlaris`, `GET /rekap/pola-jam` (Pelengkap) |
| `/admin/menu*` | `GET /menu`, `POST /menu`, `PATCH /menu/:id`, `DELETE /menu/:id` |
| `/admin/pesanan*` | `GET /pesanan`, `GET /pesanan/:id`, `PATCH …/status`, `PATCH …/pembayaran` |
| `/admin/keuangan`, `/admin/pengeluaran/baru` | `GET /rekap`, `GET /pengeluaran`, `POST /pengeluaran`, `PATCH`/`DELETE /pengeluaran/:id` |

---

## 5. Keputusan yang masih terbuka

| Kode | Pengaruh ke wireframe |
|---|---|
| K1 | cara login pemilik (token statis atau login) |
| K8 | `keteranganRasa` tampil di kartu |
| K9 | `porsi` tampil; daftar `suasanaHati` untuk panel rekomendasi |
| K11 | `nomorMeja` wajib atau opsional di checkout |
| K13 | pola jam (Pelengkap) di dashboard |
| K14 | batas jumlah 1–50 di stepper |
| — | rute `/admin/keuangan` dan `/admin/pengeluaran/baru` (usulan, perlu disetujui) |
| — | rekomendasi di `/menu` atau rute terpisah |

---

## 6. Checklist sebelum dianggap selesai

- [ ] Setiap halaman di peta rute (bagian 1) punya gambar ponsel dan komputer.
- [ ] Setiap halaman punya kondisi kosong dan galat.
- [ ] Label status dan pembayaran sudah dipakai konsisten.
- [ ] Tidak ada nama pelanggan di halaman publik (`/order-success`, `GET /pesanan/:id`).
- [ ] Setiap usulan bertanda **usulan** dan ada di daftar keputusan bagian 5.
- [ ] Sudah dibaca Arya (pemakai frontend) dan Thalib (ketua tim).
