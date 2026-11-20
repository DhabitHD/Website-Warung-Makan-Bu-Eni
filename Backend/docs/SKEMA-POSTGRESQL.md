# Skema PostgreSQL — Warung Makan Bu Eni

> **Status:** DRAFT Minggu 1 — menunggu persetujuan tim (FS, DS, AI).
> **PIC:** Dhabit · **Dipakai bersama:** Mohammad Thalib & Galih (kamus data), Rifki & Wildan (riwayat rekomendasi).
> Aturan main: **hanya pesanan berstatus `dibayar` yang masuk pemasukan**; data uji diberi penanda `data_uji` dan dipisahkan dari transaksi usaha.

---

## 1. Tabel

### `menu`
Katalog makanan — dipakai halaman pelanggan, admin, dan bahan rekomendasi AI.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | id unik, contoh: `lauk-01` |
| `nama` | `TEXT NOT NULL` | nama tampilan |
| `kategori` | `TEXT NOT NULL` | hanya `'lauk'` atau `'sayur'` (CHECK) |
| `harga` | `INTEGER NOT NULL` | Rupiah bulat, `>= 0` (CHECK) |
| `porsi` | `TEXT` | contoh: `1 porsi`, `sedang` — **opsional, keputusan minggu 1** |
| `foto` | `TEXT` | nama file gambar |
| `keterangan_rasa` | `TEXT` | deskripsi rasa, tampil di kartu menu |
| `tersedia` | `BOOLEAN NOT NULL DEFAULT true` | `false` = habis |
| `dibuat_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |
| `diperbarui_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | di-update saat ubah |

### `pesanan`
Satu baris = satu kirim pesanan pelanggan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `TEXT PRIMARY KEY` | contoh: `BE-0001` |
| `id_permintaan` | `TEXT UNIQUE` | id acak frontend per sesi checkout — **kunci cegah penyimpanan ganda** (usulan, lihat §5) |
| `nomor_meja` | `TEXT NOT NULL` | dari query QR `?table=A01` |
| `nama_pelanggan` | `TEXT NOT NULL` | dari form checkout |
| `status` | `TEXT NOT NULL DEFAULT 'masuk'` | `'masuk'` → `'diproses'` → `'selesai'` / `'batal'` (CHECK) |
| `pembayaran` | `TEXT NOT NULL DEFAULT 'belum'` | `'belum'` \| `'dibayar'` (CHECK) |
| `total_harga` | `INTEGER NOT NULL CHECK (total_harga >= 0)` | **dihitung server dari harga `menu` saat pesanan dibuat** |
| `catatan` | `TEXT` | catatan pelanggan |
| `data_uji` | `BOOLEAN NOT NULL DEFAULT false` | penanda transaksi simulasi |
| `dibuat_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | waktu pesanan masuk (pola penjualan) |
| `dibayar_pada` | `TIMESTAMPTZ` | diisi saat pembayaran menjadi `'dibayar'`, dikosongkan kembali bila `"belum"` — **basis tanggal rekap pemasukan (usulan)** |
| `diperbarui_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |

### `item_pesanan`
Rincian tiap menu dalam satu pesanan. Nama & harga **disalin** saat pesanan dibuat agar riwayat tidak ikut berubah bila menu diedit.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | |
| `pesanan_id` | `TEXT NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE` | |
| `menu_id` | `TEXT REFERENCES menu(id) ON DELETE SET NULL` | `NULL` bila menu sudah dihapus — nama & harga salinan tetap ada |
| `nama` | `TEXT NOT NULL` | salinan nama menu |
| `harga` | `INTEGER NOT NULL` | salinan harga saat pesanan |
| `jumlah` | `INTEGER NOT NULL CHECK (jumlah > 0)` | |

### `pengeluaran`
Catatan biaya yang dimasukkan pemilik (bukan dari pesanan).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | |
| `keterangan` | `TEXT NOT NULL` | contoh: `Beli bahan baku` |
| `nominal` | `INTEGER NOT NULL CHECK (nominal > 0)` | Rupiah bulat |
| `tanggal` | `DATE NOT NULL` | untuk rekap per periode |
| `data_uji` | `BOOLEAN NOT NULL DEFAULT false` | penanda |
| `dibuat_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |

### `riwayat_rekomendasi`
Hasil kombinasi menu yang diminta pembeli — disimpan Express (bukan FastAPI) setelah lolos pemeriksaan harga & ketersediaan.

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | `BIGSERIAL PRIMARY KEY` | |
| `nomor_meja` | `TEXT` | |
| `suasana_hati` | `TEXT NOT NULL` | nilai dari enum yang disepakati AI |
| `tingkat_pedas` | `INTEGER NOT NULL CHECK (tingkat_pedas BETWEEN 0 AND 2)` | |
| `anggaran` | `INTEGER NOT NULL CHECK (anggaran > 0)` | batas rupiah |
| `hasil_menu_ids` | `TEXT[] NOT NULL` | id menu hasil kombinasi |
| `total_harga` | `INTEGER NOT NULL` | total hasil kombinasi |
| `alasan` | `TEXT` | penjelasan agar bisa dibaca pembeli |
| `sumber_model` | `TEXT NOT NULL` | `'fine-tune'` \| `'llm'` — untuk evaluasi AI |
| `data_uji` | `BOOLEAN NOT NULL DEFAULT false` | penanda |
| `dibuat_pada` | `TIMESTAMPTZ NOT NULL DEFAULT now()` | |

---

## 2. Indeks

```sql
CREATE INDEX idx_pesanan_dibuat_pada   ON pesanan (dibuat_pada);
CREATE INDEX idx_pesanan_status        ON pesanan (status);
CREATE INDEX idx_item_pesanan_pesanan  ON item_pesanan (pesanan_id);
CREATE INDEX idx_pengeluaran_tanggal   ON pengeluaran (tanggal);
CREATE INDEX idx_menu_kategori         ON menu (kategori);
```

## 3. Perhitungan rekap (aturan bisnis)

```text
pemasukan periode  = SUM(total_harga)  WHERE pembayaran = 'dibayar'
                       AND data_uji = false AND dibayar_pada dalam periode
                       (usulan basis tanggal; lihat §5)
pengeluaran periode = SUM(nominal)      WHERE data_uji = false
                       AND tanggal dalam periode
saldo arus kas      = pemasukan − pengeluaran        (bukan laba bersih)
menu terlaris       = JOIN item_pesanan × pesanan
                      WHERE pembayaran = 'dibayar' AND data_uji = false
                      GROUP BY item_pesanan.nama (salinan), jumlah pesanan terbesar
                      (pakai salinan nama karena menu_id bisa NULL bila menu dihapus)
```

- Status `selesai` **sama sekali tidak** menambah pemasukan — hanya `pembayaran = 'dibayar'`.
- Pengulangan permintaan ubah status tidak menghitung ganda (idempoten: `total_harga` dihitung saat pesanan dibuat, bukan saat status berubah).
- Pengiriman ulang `id_permintaan` yang sama mengembalikan pesanan lama, bukan membuat pesanan baru.
- Pesanan berstatus `batal` tidak boleh ditandai `dibayar`; pesanan yang sudah `dibayar` tidak bisa langsung `batal` (ubah pembayaran ke `belum` dulu).

## 4. Pemisahan data uji

Semua tabel transaksi punya kolom `data_uji`. Selama pengembangan, seed/contoh diisi `data_uji = true` sehingga rekap usaha (yang menampilkan `data_uji = false`) tidak tercampur. Sebelum demonstrasi, tim memastikan tidak ada sisa `data_uji = true` yang tidak disengaja.

## 5. Keputusan yang masih menunggu

| # | Keputusan | Alternatif | PIC keputusan |
|---|---|---|---|
| 1 | Kolom `porsi` — ikut saran plan atau tidak | ada / tidak ada | Dhabit + Arya + UMKM |
| 2 | Id pesanan format `BE-0001` vs UUID | TEXT vs UUID | Dhabit + Arya |
| 3 | Akses DB: **Prisma** vs `node-postgres` | keduanya diizinkan plan | Dhabit |
| 4 | Penamaan kolom `data_uji` | `is_test` (Inggris) vs `data_uji` | Dhabit + Galih |
| 5 | Basis tanggal pemasukan rekap: `dibayar_pada` (usulan) vs `dibuat_pada` | | Dhabit + Galih |
| 6 | Kolom `id_permintaan` (kunci cegah ganda) — disetujui? | ya / tanpa itu | Dhabit + Arya |
| 7 | `keterangan_rasa` (skema) vs `deskripsi` (frontend) — samakan nama | petakan / ubah nama | Dhabit + Arya |
