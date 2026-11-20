# Skema PostgreSQL — Versi 3

> **Status:** DRAFT siap disepakati — target persetujuan **26 Nov 2026**.
> **PIC:** Dhabit · **Ditinjau:** Mohammad Thalib & Galih (kamus data dan aturan rekap), Rifki & Wildan (riwayat rekomendasi).
> **Kontrak JSON terkait:** `KONTRAK-API.md` (versi 3). Pemetaan nama ada di bagian 1.4 dokumen itu.
> **Tier:** semua tabel dipakai Inti kecuali `riwayat_rekomendasi` (Lanjutan, untuk rekomendasi AI).
> **Mesin basis data:** PostgreSQL 15 atau lebih baru (lokal, Neon, atau Supabase).

---

## 0. Ringkasan perubahan dari versi 2

| Perubahan | Alasan |
|---|---|
| Ditulis sebagai **DDL SQL lengkap**, tidak lagi daftar kolom saja | Dapat langsung dijalankan dan diuji |
| **CHECK constraint** untuk status, pembayaran, dan konsistensi `dibayar_pada` | Plan: "harga, jumlah pesanan, dan status pembayaran diperiksa" dijamin di level DB, bukan hanya di kode |
| `dibayar_pada` **wajib sesuai** `pembayaran` (dijaga constraint) | Basis rekap pemasukan harus selalu bisa dihitung |
| `subtotal` di `item_pesanan` sebagai **kolom terhitung** | Total pesanan tidak bisa menyimpang dari item |
| Kolom `porsi` dan `keterangan_rasa` ditambahkan di `menu` | Plan mewajibkan keduanya dalam data menu |
| Kolom `kode_alasan`, `latensi_ms` di `riwayat_rekomendasi` | Bukti kasus uji "layanan AI dimatikan atau lambat" |
| **Sekuens** untuk id pesanan `BE-0001` | Konsisten dengan kontrak; tidak bergantung pada tanggal |
| **Zona waktu Asia/Jakarta** ditetapkan untuk semua rekap | Pesanan malam hari tidak bergeser ke tanggal berikutnya |
| Ditambah indeks untuk rekap dan pola jam | Dasbor tetap cepat saat data bertambah |
| `nomor_meja` **nullable** (v2 `NOT NULL`) | Sesuai kesepakatan tim: `?table=` opsional. Kontrak v3 ikut berubah |
| Penanganan race idempotensi: `INSERT … ON CONFLICT DO NOTHING` | Permintaan identik bersamaan tidak lagi menghasilkan galat (bagian 4.1) |
| Kunci optimistik untuk status **dan** pembayaran | Dua pembaruan bersamaan tidak saling menimpa (bagian 4.2) |
| Contoh harga diperbaiki ke katalog resmi (`lauk-05`, `sayur-07`) | Contoh v2 tidak cocok dengan katalog |

---

## 1. Konvensi

### 1.1 Penamaan
- Nama tabel dan kolom: **snake_case**, Bahasa Indonesia, mengikuti istilah plan.
- Nilai enum disimpan sebagai `TEXT` dengan `CHECK`, bukan tipe `ENUM` PostgreSQL. Alasannya: menambah nilai cukup dengan `ALTER`, tidak perlu migrasi tipe.

### 1.2 Tipe data

| Jenis | Tipe | Alasan |
|---|---|---|
| Uang (Rupiah bulat) | `INTEGER` | Tidak ada pecahan rupiah di warung; batas 2 miliar cukup untuk satu warung |
| Waktu | `TIMESTAMPTZ` | Disimpan dalam UTC, ditampilkan dalam WIB |
| Tanggal pengeluaran | `DATE` | Tidak butuh jam |
| Id pesanan | `TEXT` berformat `BE-0001` | Mudah dibaca di dapur dan saat berbicara dengan pelanggan |
| Id permintaan | `UUID` | Dibuat frontend; tidak mungkin tabrakan |

### 1.3 Zona waktu rekap
Semua filter periode memakai tanggal **WIB**:

```sql
(kolom_waktu AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $dari AND $sampai
```

Pola ini dipakai di setiap query rekap (bagian 6). Jangan membandingkan `TIMESTAMPTZ` langsung dengan tanggal.

### 1.4 Pemetaan JSON ↔ kolom
Lihat tabel lengkap di `KONTRAK-API.md` bagian 1.4. Express bertugas mengubah dari `snake_case` ke `camelCase`.

---

## 2. Diagram relasi

```text
  menu ─────────────┐
   │ 1                │ ON DELETE SET NULL
   │                  │
   │ N                ▼
  item_pesanan  ◄── N ── 1  pesanan
  (nama, harga,           (status, pembayaran,
   jumlah, subtotal)       total_harga, dibayar_pada)

  pengeluaran           (berdiri sendiri)
  riwayat_rekomendasi   (menyimpan id menu sebagai array; tanpa FK — lihat 4.5)
```

---

## 3. DDL — pembuatan tabel

Urutan eksekusi sudah benar (tabel induk dulu). Semua berada dalam satu skema `public`.

### 3.1 Sekuens id pesanan

```sql
CREATE SEQUENCE pesanan_nomor_seq START 1;
```

### 3.2 `menu`

```sql
CREATE TABLE menu (
  id               TEXT PRIMARY KEY,                       -- contoh: lauk-05 (Ayam Goreng), sayur-07 (Sop Bening)
  nama             TEXT NOT NULL
                   CHECK (char_length(nama) BETWEEN 2 AND 60),
  kategori         TEXT NOT NULL
                   CHECK (kategori IN ('lauk', 'sayur')),
  harga            INTEGER NOT NULL
                   CHECK (harga BETWEEN 0 AND 10000000),
  porsi            TEXT
                   CHECK (porsi IS NULL OR char_length(porsi) <= 40),
  foto             TEXT NOT NULL,                          -- nama berkas gambar
  keterangan_rasa  TEXT
                   CHECK (keterangan_rasa IS NULL OR char_length(keterangan_rasa) <= 200),
  tersedia         BOOLEAN NOT NULL DEFAULT true,          -- false = habis
  dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  diperbarui_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 3.3 `pesanan`

```sql
CREATE TABLE pesanan (
  id               TEXT PRIMARY KEY
                   DEFAULT ('BE-' || lpad(nextval('pesanan_nomor_seq')::text, 4, '0')),
  id_permintaan    UUID NOT NULL UNIQUE,                   -- kunci cegah penyimpanan ganda
  nama_pelanggan   TEXT NOT NULL
                   CHECK (char_length(nama_pelanggan) BETWEEN 2 AND 60),
  nomor_meja       TEXT                                    -- NULL bila pesanan tanpa nomor meja (opsional)
                   CHECK (nomor_meja IS NULL OR nomor_meja ~ '^[A-Za-z0-9-]{1,10}$'),
  catatan          TEXT
                   CHECK (catatan IS NULL OR char_length(catatan) <= 200),
  status           TEXT NOT NULL DEFAULT 'masuk'
                   CHECK (status IN ('masuk', 'diproses', 'selesai', 'batal')),
  pembayaran       TEXT NOT NULL DEFAULT 'belum'
                   CHECK (pembayaran IN ('belum', 'dibayar')),
  total_harga      INTEGER NOT NULL
                   CHECK (total_harga >= 0),               -- dihitung server saat pesanan dibuat
  data_uji         BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  dibayar_pada     TIMESTAMPTZ,                            -- NULL bila belum dibayar
  diperbarui_pada  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- dibayar_pada terisi tepat bila pembayaran = 'dibayar'
  CONSTRAINT pesanan_dibayar_konsisten
    CHECK ((pembayaran = 'dibayar') = (dibayar_pada IS NOT NULL)),

  -- pesanan batal tidak boleh berstatus dibayar
  CONSTRAINT pesanan_batal_tidak_dibayar
    CHECK (NOT (status = 'batal' AND pembayaran = 'dibayar'))
);
```

> **Catatan nomor pesanan (celah pada nomor):** nilai `DEFAULT` dari sekuens dievaluasi setiap kali `INSERT` dicoba, walaupun baris akhirnya dilewati oleh `ON CONFLICT DO NOTHING` atau transaksi dibatalkan. Akibatnya ada dua penyebab celah:
>
> | Penyebab | Menghabiskan nomor? | Contoh |
> |---|---|---|
> | Permintaan ulang yang sudah tersimpan (langkah 0 di bagian 4.1) | **tidak**, karena `INSERT` tidak pernah dicoba | `BE-0001` dikirim ulang → tetap `BE-0001` |
> | Dua permintaan identik bersamaan, yang kalah di `ON CONFLICT` | **ya**, satu nomor terbuang | pemenang `BE-0002`, yang kalah memakan `BE-0003` |
> | Insert gagal karena validasi database atau transaksi dibatalkan | **ya** | `BE-0005` dibuang, pesanan berikutnya `BE-0006` |
>
> Celah hanya muncul pada dua kasus terakhir, dan jumlahnya sangat kecil. Celah **tidak** berarti pesanan hilang. Nomor adalah label, bukan penghitung. Rekap dihitung dari tabel, tidak dari nomor. Pemilik yang melihat `BE-0003` hilang boleh diberi tahu bahwa itu percobaan yang gagal, bukan pesanan yang dihapus.
>
> Perilaku ini sudah diuji di PostgreSQL 16: replay tidak menaikkan sekuens (`last_value` tetap 1), sedangkan dua `ON CONFLICT` yang kalah menaikkannya dari 1 ke 3.

### 3.4 `item_pesanan`

```sql
CREATE TABLE item_pesanan (
  id          BIGSERIAL PRIMARY KEY,
  pesanan_id  TEXT NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE,
  menu_id     TEXT REFERENCES menu(id) ON DELETE SET NULL, -- NULL bila menu sudah dihapus
  nama        TEXT NOT NULL,                               -- salinan nama saat dipesan
  harga       INTEGER NOT NULL CHECK (harga >= 0),         -- salinan harga saat dipesan
  jumlah      INTEGER NOT NULL CHECK (jumlah BETWEEN 1 AND 50),
  subtotal    INTEGER GENERATED ALWAYS AS (harga * jumlah) STORED
);
```

### 3.5 `pengeluaran`

```sql
CREATE TABLE pengeluaran (
  id               BIGSERIAL PRIMARY KEY,
  keterangan       TEXT NOT NULL
                   CHECK (char_length(keterangan) BETWEEN 2 AND 120),
  nominal          INTEGER NOT NULL
                   CHECK (nominal > 0 AND nominal <= 100000000),
  tanggal          DATE NOT NULL,                          -- tidak boleh masa depan: divalidasi di Zod
  data_uji         BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada      TIMESTAMPTZ NOT NULL DEFAULT now(),
  diperbarui_pada  TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> `CHECK` tidak boleh memakai `now()` (tidak konstan), jadi aturan "tidak di masa depan" dijaga di Zod (`KONTRAK-API.md` 5.6).

### 3.6 `riwayat_rekomendasi` (Lanjutan)

```sql
CREATE TABLE riwayat_rekomendasi (
  id              BIGSERIAL PRIMARY KEY,
  nomor_meja      TEXT
                  CHECK (nomor_meja IS NULL OR nomor_meja ~ '^[A-Za-z0-9-]{1,10}$'),
  suasana_hati    TEXT NOT NULL,                           -- daftar final menunggu AI
  tingkat_pedas   SMALLINT NOT NULL
                  CHECK (tingkat_pedas BETWEEN 0 AND 2),
  anggaran        INTEGER NOT NULL
                  CHECK (anggaran > 0),
  hasil_menu_ids  TEXT[] NOT NULL DEFAULT '{}',            -- id menu hasil; kosong bila gagal
  total_harga     INTEGER
                  CHECK (total_harga IS NULL OR total_harga >= 0),
  alasan          TEXT,
  sumber_model    TEXT NOT NULL
                  CHECK (sumber_model IN ('fine-tune', 'llm', 'gagal')),
  kode_alasan     TEXT
                  CHECK (kode_alasan IN ('AI_TIDAK_TERSEDIA', 'ANGGARAN_TERLALU_RENDAH', 'MENU_TIDAK_CUKUP')),
  latensi_ms      INTEGER
                  CHECK (latensi_ms IS NULL OR latensi_ms >= 0),
  data_uji        BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- percobaan gagal wajib punya kode_alasan dan tanpa hasil;
  -- percobaan berhasil wajib punya hasil dan tanpa kode_alasan
  CONSTRAINT riwayat_gagal_konsisten
    CHECK (
      (sumber_model = 'gagal' AND kode_alasan IS NOT NULL AND total_harga IS NULL AND cardinality(hasil_menu_ids) = 0)
      OR
      (sumber_model <> 'gagal' AND kode_alasan IS NULL AND total_harga IS NOT NULL AND cardinality(hasil_menu_ids) > 0)
    )
);
```

### 3.7 Indeks

```sql
CREATE INDEX idx_pesanan_dibuat_pada  ON pesanan (dibuat_pada);
CREATE INDEX idx_pesanan_status       ON pesanan (status);
CREATE INDEX idx_pesanan_dibayar      ON pesanan (dibayar_pada) WHERE pembayaran = 'dibayar';
CREATE INDEX idx_item_pesanan_pesanan ON item_pesanan (pesanan_id);
CREATE INDEX idx_item_pesanan_menu    ON item_pesanan (menu_id);
CREATE INDEX idx_pengeluaran_tanggal  ON pengeluaran (tanggal);
CREATE INDEX idx_menu_kategori        ON menu (kategori);
CREATE INDEX idx_riwayat_dibuat       ON riwayat_rekomendasi (dibuat_pada);
```

`id_permintaan` sudah punya indeks unik dari `UNIQUE`.

---

## 4. Aturan integritas (ringkasan)

| # | Aturan | Dijaga oleh |
|---|---|---|
| 1 | Harga menu tidak negatif dan ≤ 10 juta | `CHECK` di `menu.harga` + Zod |
| 2 | Jumlah item 1–50 | `CHECK` di `item_pesanan.jumlah` + Zod |
| 3 | `subtotal` selalu `harga × jumlah` | kolom terhitung |
| 4 | `total_harga` pesanan = jumlah semua `subtotal` | **transaksi** di Express (lihat 4.1) |
| 5 | Pesanan dibayar selalu punya `dibayar_pada` | `CHECK` `pesanan_dibayar_konsisten` |
| 6 | Pesanan batal tidak pernah dibayar | `CHECK` `pesanan_batal_tidak_dibayar` |
| 7 | Id permintaan tidak bisa dipakai dua kali | `UNIQUE` di `pesanan.id_permintaan` |
| 8 | Menu yang dihapus tidak memutus riwayat pesanan | `ON DELETE SET NULL` + salinan nama dan harga |
| 9 | Rekomendasi gagal tidak punya hasil dan wajib punya alasan | `CHECK` `riwayat_gagal_konsisten` |
| 10 | Data uji tidak tercampur rekap usaha | filter `data_uji = false` di semua query rekap |
| 11 | Dua permintaan identik bersamaan menghasilkan satu pesanan | `INSERT … ON CONFLICT (id_permintaan) DO NOTHING` (bagian 4.1) |
| 12 | Pembaruan bersamaan tidak saling menimpa | kunci optimistik `WHERE nilai_lama` (bagian 4.2) |

### 4.1 Pembuatan pesanan dalam satu transaksi

**Langkah 0 — pemeriksaan idempotensi di luar transaksi:**

```sql
SELECT * FROM pesanan WHERE id_permintaan = $1;
```
Bila ada baris → balas `200` dengan pesanan tersebut. Isi permintaan tidak divalidasi ulang.

**Langkah 1–6 — dalam satu transaksi (`BEGIN … COMMIT`):**

1. Validasi masukan dengan Zod, sebelum transaksi dibuka.
2. `SELECT id, nama, harga, tersedia FROM menu WHERE id = ANY($1) FOR SHARE`. Kunci baris menu agar harga tidak berubah di tengah transaksi. Bila ada `menuId` yang tidak ada di tabel → `ROLLBACK`, lalu balas `400 MASUKAN_TIDAK_SAH` dengan `rincian` yang menunjuk `items.N.menuId`. Bila `tersedia = false` → `ROLLBACK`, lalu balas `400 MENU_HABIS`. `404` tidak dipakai di sini karena URL-nya benar, yang salah isi body (lihat KONTRAK-API.md bagian 4.3).
3. Bila `hargaDiharapkan` dikirim (Lanjutan) dan berbeda dengan `harga` → `ROLLBACK`, lalu balas `HARGA_BERUBAH` dengan harga terkini.
4. Hitung `total_harga` dari `harga` yang sudah dikunci.
5. Simpan pesanan dengan **`ON CONFLICT`**:

   ```sql
   INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, catatan, total_harga)
   VALUES ($1, $2, $3, $4, $5)
   ON CONFLICT (id_permintaan) DO NOTHING
   RETURNING id;
   ```

   - Ada baris yang dikembalikan → lanjut ke langkah 6.
   - **Tidak ada baris** → permintaan identik lain baru saja menyimpan pesanan. `ROLLBACK`, lalu baca pesanan yang menang dengan `SELECT … WHERE id_permintaan = $1` dan balas `200`. Server **tidak** membalas galat.

6. `INSERT INTO item_pesanan` untuk setiap baris (nama dan harga disalin dari langkah 2), lalu `COMMIT` dan balas `201`.

**Mengapa `ON CONFLICT`, bukan menangkap galat `UNIQUE`:** `ON CONFLICT` tidak membuat transaksi gagal, sehingga tidak perlu menangkap galat dari driver. Hasilnya bisa langsung dibaca dan dibalas.

Alur ini mencegah pesanan tersimpan setengah (header tanpa item) dan mencegah harga berubah di tengah transaksi.

### 4.2 Perubahan status dan pembayaran

Kedua pembaruan memakai **kunci optimistik**: kondisi `WHERE` memuat nilai lama. Bila tidak ada baris yang berubah, server membaca ulang pesanan dan memutuskan balasannya.

**Status:**

```sql
UPDATE pesanan
SET status = $baru, diperbarui_pada = now()
WHERE id = $1 AND status = $lama
RETURNING *;
```

**Pembayaran** (sebelumnya belum memakai kunci; sekarang sama dengan status):

```sql
UPDATE pesanan
SET pembayaran = $baru,
    dibayar_pada = CASE WHEN $baru = 'dibayar' THEN now() ELSE NULL END,
    diperbarui_pada = now()
WHERE id = $1 AND pembayaran = $lama AND status <> 'batal'
RETURNING *;
```

Bila `RETURNING` kosong, baca ulang pesanan dan tentukan balasan:

| Kondisi setelah dibaca ulang | Balasan |
|---|---|
| sudah berada di nilai yang diminta | `200`, tanpa perubahan (idempoten) |
| transisi tidak sah, mis. `batal` dari `selesai` | `409 KONFLIK` |
| pesanan `batal` dan permintaan menandai dibayar | `409 KONFLIK` |
| pesanan tidak ada | `404 TIDAK_DITEMUKAN` |

**Penjaga terakhir:** bila dua permintaan bersamaan lolos pemeriksaan (mis. satu membatalkan, satu menandai dibayar), constraint `pesanan_batal_tidak_dibayar` tetap menolak. Database menjadi pelindung terakhir, bukan hanya kode aplikasi. Galat `23514` (CHECK violation) dipetakan ke `409 KONFLIK`.

Constraint `pesanan_dibayar_konsisten` menjaga `dibayar_pada` selalu terisi saat dibayar dan `NULL` saat belum.

### 4.3 Pengeluaran
Tidak ada aturan transaksi tambahan. Koreksi dilakukan dengan `UPDATE` atau `DELETE`, tanpa riwayat terpisah di MVP.

### 4.4 Menu dihapus
`DELETE FROM menu` berhasil walaupun menu pernah dipesan karena `item_pesanan.menu_id` menjadi `NULL`. Nama dan harga di `item_pesanan` tetap utuh sehingga rekap menu terlaris tidak berubah.

### 4.5 `riwayat_rekomendasi.hasil_menu_ids`
Berupa array teks tanpa foreign key (PostgreSQL tidak mendukung FK pada elemen array). Konsekuensinya: id menu yang sudah dihapus masih tercatat di riwayat. Ini diterima karena riwayat rekomendasi hanya untuk evaluasi AI, bukan untuk rekap uang.

---

## 5. Data uji dan seed

### 5.1 Aturan
- Setiap baris transaksi uji diberi `data_uji = true`. Berlaku untuk `pesanan`, `pengeluaran`, dan `riwayat_rekomendasi`.
- `menu` tidak punya `data_uji` karena katalog memang untuk dipakai bersama. Data uji di menu hanya boleh diubah saat pengembangan.
- API tidak pernah menerima `data_uji` dari klien. Hanya skrip seed yang menulis `true`.
- Sebelum demonstrasi, jalankan pemeriksaan:

```sql
SELECT 'pesanan' AS tabel, count(*) FROM pesanan WHERE data_uji
UNION ALL SELECT 'pengeluaran', count(*) FROM pengeluaran WHERE data_uji
UNION ALL SELECT 'riwayat', count(*) FROM riwayat_rekomendasi WHERE data_uji;
```

Pemilik diminta memastikan hasilnya sesuai rencana. Bila ada data uji yang tersisa di produksi, tim memutuskan bersama apakah dihapus.

### 5.2 Seed menu
Isi awal menu diambil dari daftar UMKM (18 menu pada mock frontend saat ini). Nilai `porsi` dan `keterangan_rasa` belum tersedia dan menunggu daftar dari PIC UMKM (lihat `KONTRAK-API.md` bagian 10, keputusan #9).

---

## 6. Query rekap (acuan untuk DS dan Express)

Parameter: `$1` = tanggal `dari`, `$2` = tanggal `sampai` (keduanya `DATE`).

### 6.1 Pemasukan, pengeluaran, dan saldo

```sql
WITH pemasukan AS (
  SELECT COALESCE(SUM(total_harga), 0)                AS nilai,
         COUNT(*)                                     AS jumlah_pesanan
  FROM pesanan
  WHERE pembayaran = 'dibayar'
    AND data_uji = false
    AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1 AND $2
),
pengeluaran_periode AS (
  SELECT COALESCE(SUM(nominal), 0) AS nilai
  FROM pengeluaran
  WHERE data_uji = false
    AND tanggal BETWEEN $1 AND $2
),
pesanan_masuk AS (
  SELECT COUNT(*) AS jumlah
  FROM pesanan
  WHERE status <> 'batal'
    AND data_uji = false
    AND (dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1 AND $2
)
SELECT
  pemasukan.nilai                          AS pemasukan,
  pengeluaran_periode.nilai                AS pengeluaran,
  pemasukan.nilai - pengeluaran_periode.nilai AS saldo_arus_kas,
  pemasukan.jumlah_pesanan                 AS jumlah_pesanan_dibayar,
  pesanan_masuk.jumlah                     AS jumlah_pesanan_masuk
FROM pemasukan, pengeluaran_periode, pesanan_masuk;
```

Query ini selalu mengembalikan satu baris, dengan nol bila tidak ada transaksi. Itu sebabnya periode kosong tidak menjadi galat.

### 6.2 Menu terlaris

```sql
SELECT ip.nama,
       SUM(ip.jumlah)   AS jumlah_terjual,
       SUM(ip.subtotal) AS omzet
FROM item_pesanan ip
JOIN pesanan p ON p.id = ip.pesanan_id
WHERE p.pembayaran = 'dibayar'
  AND p.data_uji = false
  AND (p.dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1 AND $2
GROUP BY ip.nama
ORDER BY jumlah_terjual DESC, ip.nama
LIMIT $3;
```

Dikelompokkan berdasarkan `nama` salinan, bukan `menu_id`, agar menu yang sudah dihapus tetap muncul.

### 6.3 Pola jam pesanan masuk

```sql
SELECT EXTRACT(HOUR FROM p.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::int AS jam,
       COUNT(*) AS jumlah_pesanan
FROM pesanan p
WHERE p.status <> 'batal'
  AND p.data_uji = false
  AND (p.dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1 AND $2
GROUP BY jam
ORDER BY jam;
```

### 6.4 Aturan yang tidak boleh dilanggar
- Status `selesai` **tidak** dihitung sebagai pemasukan. Hanya `pembayaran = 'dibayar'`.
- Pesanan `batal` tidak masuk pola jam. Pesanan batal yang pernah dibayar tidak mungkin ada (constraint 3.3).
- Setiap query rekap wajib memakai `data_uji = false`.

---

## 7. Keputusan terbuka

| # | Keputusan | Rekomendasi saya | PIC |
|---|---|---|---|
| 1 | Kolom `porsi` ikut atau tidak | **Ikut**, nullable | Dhabit + UMKM |
| 2 | Format id pesanan | **`BE-0001`** dari sekuens (sudah tertulis di DDL) | Dhabit + Arya |
| 3 | Akses DB: Prisma atau node-postgres | **node-postgres (`pg`) dengan SQL langsung.** Query rekap di bagian 6 lebih mudah diverifikasi sebagai SQL | Dhabit |
| 4 | Nama kolom `data_uji` atau `is_test` | **`data_uji`** (konsisten dengan istilah plan) | Dhabit + Galih |
| 5 | Basis tanggal pemasukan | **`dibayar_pada`** | Galih + Mohammad Thalib |
| 6 | Kolom `id_permintaan` | **Disetujui** (kunci cegah ganda) | Dhabit + Arya |
| 7 | Nilai `suasana_hati` | Menunggu daftar final AI | Rifki + Wildan |
| 8 | Batas jumlah item (50) | Disetujui | Arya |
| 9 | `nomor_meja` nullable | **Ya**, sesuai kesepakatan tim. Form checkout frontend masih mewajibkan, keputusan ada di Arya | Arya + Dhabit |
| 10 | Autentikasi pemilik di Inti | **Token statis** dari env, login sungguhan di Lanjutan (kontrak bagian 7) | Dhabit + Arya |

---

## 8. Urutan migrasi awal

1. Buat sekuens `pesanan_nomor_seq`.
2. Buat tabel `menu`.
3. Buat tabel `pesanan`, lalu `item_pesanan`.
4. Buat `pengeluaran` dan `riwayat_rekomendasi`.
5. Buat semua indeks (bagian 3.7).
6. Jalankan seed menu, lalu seed data uji dengan `data_uji = true`.
7. Jalankan pemeriksaan bagian 5.1.

Setiap perubahan skema sesudah ini dibuat sebagai berkas migrasi baru, tidak mengedit berkas lama. Sebelum migrasi produksi, cadangkan database (`pg_dump`), sesuai risiko R4 di plan.
