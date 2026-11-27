# Skema PostgreSQL — Versi 3

> **Status:** DRAFT siap disepakati — target persetujuan **26 Nov 2026**.
> **PIC:** Dhabit · **Ditinjau:** Mohammad Thalib & Galih (kamus data dan aturan rekap), Rifki & Wildan (riwayat rekomendasi).
> **Kontrak JSON terkait:** `KONTRAK-API.md` (versi 3). Pemetaan nama ada di bagian 1.4 dokumen itu.
> **Tier:** semua tabel dipakai Inti kecuali `riwayat_rekomendasi` (Lanjutan, untuk rekomendasi AI).
> **Mesin basis data:** PostgreSQL 15 atau lebih baru (lokal, Neon, atau Supabase).

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
  id               TEXT PRIMARY KEY
                   CHECK (id ~ '^[LS][0-9]{2}$'),          -- sama dengan menu_id di dataset: L01–L11 lauk, S01–S07 sayur
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
> Bukti uji ada di **Lampiran A** (`db/tests/03_sekuens_idempotensi.sql`): replay tidak menaikkan sekuens, dan satu permintaan yang kalah di `ON CONFLICT` memakan satu nomor. Uji itu berurutan, bukan balapan sungguhan. Ia meniru kekalahan dengan dua `INSERT` berturut-turut. Balapan sungguhan dengan dua koneksi belum diuji.

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
| 13 | ID menu sama dengan `menu_id` dataset (L01–L11 lauk, S01–S07 sayur) | `CHECK (id ~ '^[LS][0-9]{2}$')` di `menu.id`; uji di `01` (`lauk-05` dan `L5` ditolak) |

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
  AND NOT ($baru = 'batal' AND pembayaran = 'dibayar')
RETURNING *;
```

Cek `pembayaran` di `WHERE` penting. Tanpanya, pesanan yang sudah dibayar dibatalkan dan hanya constraint `pesanan_batal_tidak_dibayar` yang menolak. Akibatnya klien menerima galat database yang generik. Dengan cek di `WHERE`, `UPDATE` cukup mengembalikan 0 baris, dan aplikasi membalas pesan yang jelas (lihat tabel di bawah).

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
| status `batal` diminta, pesanan sudah `dibayar` | `409 KONFLIK` dengan pesan "Pesanan sudah dibayar. Ubah pembayaran ke 'belum' dulu, lalu batalkan." |
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


---

## Lampiran A — Bukti uji skema

Uji dijalankan dengan `Backend/db/test.sh` pada **PostgreSQL 16.16** (image `postgres:16-alpine`), container bersih yang dinyalakan khusus untuk run ini. Tanggal mesin saat run: **27 Nov 2026, 09:40 WIB** (lihat baris `== Tanggal mesin` di A.2). Output di A.2 disalin langsung dari run tersebut, tanpa diedit.

### A.1 Cara mengulang

Prasyarat: Docker. Dari folder `Backend/`:

```bash
./db/test.sh
```

Sebelum Docker dinyalakan, skrip memeriksa bahwa `db/schema.sql` sama dengan DDL di bagian 3 dokumen ini. Jika berbeda, skrip berhenti dengan kode 4. Lalu skrip menjalankan berurutan: `db/schema.sql` → `db/fixtures/seed.sql` → `db/fixtures/helpers.sql` → setiap berkas di `db/tests/`. Setiap berkas tes berjalan dalam transaksi yang di-`ROLLBACK`. Skrip berhenti di galat pertama dan keluar dengan kode non-nol. Jika lulus semua, kode keluarnya `0`.

Berkas terkait di repo:

| Berkas | Isi |
|---|---|
| `db/schema.sql` | DDL bagian 3 (sekuens, 5 tabel, 8 indeks) |
| `db/fixtures/seed.sql` | 6 menu dari katalog, 5 pesanan (termasuk uji dan batal), item, pengeluaran |
| `db/fixtures/helpers.sql` | fungsi `uji_gagal(stmt, sqlstate, label)` |
| `db/tests/01_constraint_menolak.sql` | 24 kasus yang harus ditolak constraint |
| `db/tests/02_positif.sql` | 8 kasus data sah dan nilai default |
| `db/tests/03_sekuens_idempotensi.sql` | 3 kasus sekuens dan `ON CONFLICT` |
| `db/tests/04_rekap.sql` | 6 kasus rekap dan batas tanggal WIB |
| `db/tests/05_status_pembayaran.sql` | 6 kasus kunci optimistik status dan pembayaran |

### A.2 Hasil run

```text
== DDL di dokumen dan schema.sql sama
== Menyalakan PostgreSQL (postgres:16-alpine)
== Versi: PostgreSQL 16.16 on x86_64-pc-linux-musl, compiled by gcc (Alpine 15.2.0) 15.2.0, 64-bit
== Tanggal mesin: 2026-11-27 09:40:32 WIB
== Skema
== Data contoh
== Pembantu
== Tes: 01_constraint_menolak.sql
psql:/db/tests/01_constraint_menolak.sql:10: NOTICE:  PASS: dibayar tanpa dibayar_pada
psql:/db/tests/01_constraint_menolak.sql:13: NOTICE:  PASS: status batal tetapi sudah dibayar
psql:/db/tests/01_constraint_menolak.sql:16: NOTICE:  PASS: id_permintaan duplikat
psql:/db/tests/01_constraint_menolak.sql:19: NOTICE:  PASS: nomor_meja berisi spasi dan tanda seru
psql:/db/tests/01_constraint_menolak.sql:22: NOTICE:  PASS: total_harga negatif
psql:/db/tests/01_constraint_menolak.sql:25: NOTICE:  PASS: status di luar daftar
psql:/db/tests/01_constraint_menolak.sql:28: NOTICE:  PASS: nama pelanggan kurang dari 2 karakter
psql:/db/tests/01_constraint_menolak.sql:32: NOTICE:  PASS: jumlah item nol
psql:/db/tests/01_constraint_menolak.sql:35: NOTICE:  PASS: jumlah item di atas 50
psql:/db/tests/01_constraint_menolak.sql:38: NOTICE:  PASS: item untuk pesanan yang tidak ada
psql:/db/tests/01_constraint_menolak.sql:42: NOTICE:  PASS: kategori selain lauk/sayur
psql:/db/tests/01_constraint_menolak.sql:45: NOTICE:  PASS: harga menu negatif
psql:/db/tests/01_constraint_menolak.sql:48: NOTICE:  PASS: harga menu di atas 10 juta
psql:/db/tests/01_constraint_menolak.sql:51: NOTICE:  PASS: nama menu kurang dari 2 karakter
psql:/db/tests/01_constraint_menolak.sql:55: NOTICE:  PASS: id format lama lauk-05 ditolak
psql:/db/tests/01_constraint_menolak.sql:58: NOTICE:  PASS: id L5 tanpa dua digit ditolak
psql:/db/tests/01_constraint_menolak.sql:62: NOTICE:  PASS: pengeluaran nominal nol
psql:/db/tests/01_constraint_menolak.sql:65: NOTICE:  PASS: pengeluaran nominal negatif
psql:/db/tests/01_constraint_menolak.sql:68: NOTICE:  PASS: pengeluaran di atas Rp100 juta
psql:/db/tests/01_constraint_menolak.sql:71: NOTICE:  PASS: pengeluaran tanpa tanggal
psql:/db/tests/01_constraint_menolak.sql:75: NOTICE:  PASS: rekomendasi gagal tetapi punya hasil
psql:/db/tests/01_constraint_menolak.sql:78: NOTICE:  PASS: rekomendasi berhasil tanpa hasil
psql:/db/tests/01_constraint_menolak.sql:81: NOTICE:  PASS: tingkat pedas di luar 0-2
psql:/db/tests/01_constraint_menolak.sql:84: NOTICE:  PASS: anggaran nol
== Tes: 02_positif.sql
psql:/db/tests/02_positif.sql:14: NOTICE:  PASS: data contoh termuat (6 menu, 5 pesanan)
psql:/db/tests/02_positif.sql:27: NOTICE:  PASS: subtotal item sama dengan total pesanan (14500)
psql:/db/tests/02_positif.sql:32: NOTICE:  PASS: pesanan tanpa nomor meja diterima
psql:/db/tests/02_positif.sql:37: NOTICE:  PASS: pesanan batal berstatus belum dibayar diterima
psql:/db/tests/02_positif.sql:50: NOTICE:  PASS: nilai default pesanan (masuk, belum, data_uji false)
psql:/db/tests/02_positif.sql:59: NOTICE:  PASS: menu baru tersedia secara default, harga 0 diterima
psql:/db/tests/02_positif.sql:66: NOTICE:  PASS: riwayat berhasil dan gagal diterima
psql:/db/tests/02_positif.sql:70: NOTICE:  PASS: pengeluaran nominal 1 (batas bawah) diterima
== Tes: 03_sekuens_idempotensi.sql
psql:/db/tests/03_sekuens_idempotensi.sql:30: NOTICE:  PASS: replay (langkah 0) mengembalikan id yang sama tanpa menaikkan nomor
psql:/db/tests/03_sekuens_idempotensi.sql:60: NOTICE:  PASS: ON CONFLICT menghasilkan satu pesanan, yang kalah memakan satu nomor
psql:/db/tests/03_sekuens_idempotensi.sql:71: NOTICE:  PASS: format id pesanan sesuai BE-NNNN (BE-0019)
== Tes: 04_rekap.sql
psql:/db/tests/04_rekap.sql:40: NOTICE:  PASS: rekap Desember = pemasukan 22000, pengeluaran 5000, saldo 17000 (sesuai plan)
psql:/db/tests/04_rekap.sql:40: NOTICE:  PASS: pesanan dibayar 2, pesanan masuk 3 (belum dibayar dan batal dikecualikan)
psql:/db/tests/04_rekap.sql:60: NOTICE:  PASS: menu terlaris cocok dengan transaksi sumber (omzet total 22000)
psql:/db/tests/04_rekap.sql:81: NOTICE:  PASS: periode tanpa transaksi mengembalikan nol
psql:/db/tests/04_rekap.sql:94: NOTICE:  PASS: pembayaran 31 Des 23:30 WIB tidak masuk periode yang berakhir 30 Des
psql:/db/tests/04_rekap.sql:114: NOTICE:  PASS: batas tengah malam WIB benar (1 Jan 00:30 WIB masuk Januari, bukan Desember)
== Tes: 05_status_pembayaran.sql
psql:/db/tests/05_status_pembayaran.sql:16: NOTICE:  PASS: pembayaran dengan nilai lama salah tidak mengubah apa pun (0 baris)
psql:/db/tests/05_status_pembayaran.sql:28: NOTICE:  PASS: pembayaran dengan nilai lama benar diterima dan dibayar_pada terisi
psql:/db/tests/05_status_pembayaran.sql:40: NOTICE:  PASS: pembatalan pesanan yang sudah dibayar ditahan di WHERE (0 baris)
psql:/db/tests/05_status_pembayaran.sql:47: NOTICE:  PASS: pembatalan tanpa cek pembayaran ditolak constraint (23514)
psql:/db/tests/05_status_pembayaran.sql:65: NOTICE:  PASS: setelah pembayaran dikembalikan ke belum, pesanan bisa dibatalkan
psql:/db/tests/05_status_pembayaran.sql:73: NOTICE:  PASS: pesanan batal tidak boleh ditandai dibayar (23514)

SEMUA TES LULUS
```

Negatif kontrol: constraint `pesanan_batal_tidak_dibayar` sengaja dilepas dari salinan skema. Tes 01 gagal dengan `GAGAL: status batal tetapi sudah dibayar — SQLSTATE P0001, diharapkan 23514` dan skrip keluar non-nol. Ini membuktikan tes memang bisa gagal.

### A.3 Yang dibuktikan

| Klaim | Bukti (berkas dan jumlah kasus) |
|---|---|
| Constraint menolak 24 jenis data salah (status, pembayaran, nomor meja, ID menu, jumlah, harga, pengeluaran, rekomendasi, FK, duplikat) | `01_constraint_menolak.sql`: 24 PASS dengan SQLSTATE yang tepat (23514, 23505, 23503, 23502) |
| Data sah diterima, default bekerja, subtotal = total | `02_positif.sql`: 8 PASS |
| Replay tidak menaikkan nomor; `ON CONFLICT` menghasilkan satu pesanan; yang kalah memakan satu nomor | `03_sekuens_idempotensi.sql`: 3 PASS. Uji berurutan, bukan balapan sungguhan |
| Rekap Desember = pemasukan 22.000, pengeluaran 5.000, saldo 17.000; menu terlaris cocok dengan pemasukan | `04_rekap.sql`: 6 PASS |
| Periode kosong mengembalikan nol; batas WIB benar (31 Des 23:30 dan 1 Jan 00:30) | `04_rekap.sql`: 2 PASS |
| Pembayaran dengan nilai lama salah tidak mengubah apa pun; pembatalan pesanan dibayar ditahan di `WHERE`; pembatalan tanpa cek ditolak `23514` | `05_status_pembayaran.sql`: 6 PASS |

**Yang tidak dibuktikan oleh Lampiran ini:** logika Express (langkah 0, pembacaan ulang setelah `RETURNING` kosong, pemetaan `23514` ke `409`) dan balapan dengan dua koneksi. Itu rencana uji M2 di A.4.

### A.4 Batas uji dan rencana uji M2

**Lampiran A hanya menguji database** (DDL, constraint, sekuens, dan `UPDATE` dengan kondisi `WHERE`). **Logika aplikasi** di Express belum diuji sama sekali. Yang belum diuji:
- `ON CONFLICT` diuji dengan dua `INSERT` berurutan yang meniru kekalahan. **Balapan sungguhan dengan dua koneksi belum diuji.**
- Langkah 0 (cek `id_permintaan` sebelum transaksi) dan pembacaan ulang setelah `RETURNING` kosong.
- Pemetaan galat database ke balasan HTTP (`23514` → `409 KONFLIK`).

Rencana uji untuk M2, dijalankan terhadap Express dan PostgreSQL sungguhan:

| # | Kasus | Masukan | Hasil yang diharapkan |
|---|---|---|---|
| T-A1 | Permintaan ulang yang sudah tersimpan (langkah 0) | `idPermintaan` yang sudah ada, isi berbeda | `200` dengan pesanan lama; tidak ada baris baru; isi permintaan tidak divalidasi ulang |
| T-A2 | Dua permintaan identik **bersamaan** (`Promise.all`, dua koneksi pool) | `idPermintaan` sama, dikirim serentak | satu baris di `pesanan`; keduanya `200` atau satu `201` dan satu `200`; tanpa galat |
| T-A3 | `RETURNING` kosong pada `ON CONFLICT` | sama dengan T-A2, dari sisi yang kalah | server membaca pemenang dan membalas `200` |
| T-A4 | Status diubah ke nilai yang sama | `status = masuk` untuk pesanan `masuk` | `200` tanpa perubahan |
| T-A5 | Transisi tidak sah | `selesai` → `diproses` | `409 KONFLIK` dengan pesan transisi |
| T-A6 | Batal saat sudah dibayar | `status = batal` untuk pesanan `dibayar` | `409 KONFLIK` dengan pesan "Pesanan sudah dibayar…" (tanpa galat database) |
| T-A7 | Balapan batal vs bayar | dua permintaan bersamaan: satu `batal`, satu `dibayar` | salah satu saja berhasil; pesanan tidak pernah `batal` dan `dibayar` bersamaan |
| T-A8 | Pembayaran dengan nilai lama yang salah | `pembayaranLama` tidak cocok | `200` bila sudah berada di nilai yang diminta, `409` bila tidak |
| T-A9 | Pemetaan `23514` | `UPDATE` yang melanggar CHECK | `409 KONFLIK`, bukan `500` |
| T-A10 | `menuId` tidak dikenal | `menuId` acak di body | `400 MASUKAN_TIDAK_SAH` dengan `rincian` menunjuk `items.N.menuId` |
| T-A11 | Menu habis | `tersedia = false` | `400 MENU_HABIS` dengan `rincian` berisi `menuId` |
| T-A12 | Harga berubah | `hargaDiharapkan` berbeda dengan `harga` | `409 HARGA_BERUBAH` dengan harga terkini; pesanan tidak tersimpan |

Hasil tiap kasus dicatat di Google Sheets bersama (skenario, hasil yang diharapkan, hasil aktual, status, bukti) sesuai Project Plan bagian F.
