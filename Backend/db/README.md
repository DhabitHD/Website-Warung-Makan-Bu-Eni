# Database — skema dan pengujian

Skema PostgreSQL v3 (sumber kebenaran: `docs/SKEMA-POSTGRESQL.md`) dan pengujiannya.

## Menjalankan pengujian

Butuh Docker. Dari folder `Backend/`:

```bash
./db/test.sh
```

Skrip menyalakan PostgreSQL 16 di container bersih, memasang skema dan data contoh, lalu menjalankan semua tes di `tests/`. Lulus jika keluarannya memuat `SEMUA TES LULUS` dan kode keluarnya `0`.

Versi PostgreSQL bisa diganti dengan `PG_IMAGE`:

```bash
PG_IMAGE=postgres:17-alpine ./db/test.sh
```

## Isi

| Berkas | Fungsi |
|---|---|
| `test.sh` | menjalankan seluruh pengujian di container |
| `schema.sql` | DDL. Harus sama dengan bagian 3 `docs/SKEMA-POSTGRESQL.md` (dicek skrip) |
| `fixtures/seed.sql` | data contoh |
| `fixtures/helpers.sql` | fungsi `uji_gagal` untuk kasus yang harus ditolak constraint |
| `tests/*.sql` | kasus uji, berurutan, masing-masing dalam transaksi yang di-`ROLLBACK` |

## Mengubah skema

Ubah `docs/SKEMA-POSTGRESQL.md` bagian 3 dan `schema.sql` bersamaan. Jika tidak sama, `test.sh` berhenti dengan kode 4. Jalankan ulang setelah keduanya sinkron.
