-- 04: rekap keuangan dan analisis penjualan.
-- Angka yang diharapkan diambil dari skenario uji plan (bagian F, halaman 16–17)
-- dan dari data contoh di fixtures/seed.sql.
-- Periode: 1–31 Desember 2026, zona waktu Asia/Jakarta.

BEGIN;

-- Rekap utama (query 6.1 di SKEMA bagian 6).
DO $$
DECLARE r record;
BEGIN
  WITH pemasukan AS (
    SELECT COALESCE(SUM(total_harga), 0) AS nilai, COUNT(*) AS jumlah
    FROM pesanan
    WHERE pembayaran = 'dibayar' AND data_uji = false
      AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2026-12-01' AND DATE '2026-12-31'
  ),
  pengeluaran_periode AS (
    SELECT COALESCE(SUM(nominal), 0) AS nilai FROM pengeluaran
    WHERE data_uji = false AND tanggal BETWEEN DATE '2026-12-01' AND DATE '2026-12-31'
  ),
  pesanan_masuk AS (
    SELECT COUNT(*) AS jumlah FROM pesanan
    WHERE status <> 'batal' AND data_uji = false
      AND (dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2026-12-01' AND DATE '2026-12-31'
  )
  SELECT pemasukan.nilai AS pemasukan, pengeluaran_periode.nilai AS pengeluaran,
         pemasukan.nilai - pengeluaran_periode.nilai AS saldo,
         pemasukan.jumlah AS dibayar, pesanan_masuk.jumlah AS masuk
  INTO r
  FROM pemasukan, pengeluaran_periode, pesanan_masuk;

  IF r.pemasukan <> 22000 THEN RAISE EXCEPTION 'FAIL pemasukan %, seharusnya 22000', r.pemasukan; END IF;
  IF r.pengeluaran <> 5000 THEN RAISE EXCEPTION 'FAIL pengeluaran %, seharusnya 5000', r.pengeluaran; END IF;
  IF r.saldo <> 17000 THEN RAISE EXCEPTION 'FAIL saldo %, seharusnya 17000', r.saldo; END IF;
  IF r.dibayar <> 2 THEN RAISE EXCEPTION 'FAIL pesanan dibayar %, seharusnya 2', r.dibayar; END IF;
  IF r.masuk <> 3 THEN RAISE EXCEPTION 'FAIL pesanan masuk %, seharusnya 3', r.masuk; END IF;
  RAISE NOTICE 'PASS: rekap Desember = pemasukan 22000, pengeluaran 5000, saldo 17000 (sesuai plan)';
  RAISE NOTICE 'PASS: pesanan dibayar 2, pesanan masuk 3 (belum dibayar dan batal dikecualikan)';
END $$;

-- Menu terlaris: hanya pesanan dibayar, data uji dikecualikan. Jumlahnya cocok dengan pemasukan.
DO $$
DECLARE hasil text; total int;
BEGIN
  SELECT string_agg(x.nama || '=' || x.omzet, ', ' ORDER BY x.nama), sum(x.omzet)
  INTO hasil, total
  FROM (
    SELECT ip.nama, SUM(ip.subtotal) AS omzet
    FROM item_pesanan ip JOIN pesanan p ON p.id = ip.pesanan_id
    WHERE p.pembayaran = 'dibayar' AND p.data_uji = false
      AND (p.dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2026-12-01' AND DATE '2026-12-31'
    GROUP BY ip.nama
  ) x;
  IF hasil <> 'Ayam Goreng=9500, Bandeng Goreng=7500, Sop Bening=5000' THEN
    RAISE EXCEPTION 'FAIL menu terlaris: %', hasil;
  END IF;
  IF total <> 22000 THEN RAISE EXCEPTION 'FAIL omzet menu % tidak sama dengan pemasukan 22000', total; END IF;
  RAISE NOTICE 'PASS: menu terlaris cocok dengan transaksi sumber (omzet total 22000)';
END $$;

-- Periode kosong: harus mengembalikan nol, bukan galat.
DO $$
DECLARE r record;
BEGIN
  WITH pemasukan AS (
    SELECT COALESCE(SUM(total_harga), 0) AS nilai FROM pesanan
    WHERE pembayaran = 'dibayar' AND data_uji = false
      AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2027-01-01' AND DATE '2027-01-31'
  ),
  pengeluaran_periode AS (
    SELECT COALESCE(SUM(nominal), 0) AS nilai FROM pengeluaran
    WHERE data_uji = false AND tanggal BETWEEN DATE '2027-01-01' AND DATE '2027-01-31'
  )
  SELECT pemasukan.nilai AS pemasukan, pengeluaran_periode.nilai AS pengeluaran INTO r
  FROM pemasukan, pengeluaran_periode;
  IF r.pemasukan <> 0 OR r.pengeluaran <> 0 THEN
    RAISE EXCEPTION 'FAIL periode kosong: %', r;
  END IF;
  RAISE NOTICE 'PASS: periode tanpa transaksi mengembalikan nol';
END $$;

-- Batas tanggal WIB. P2 dibayar 31 Des 23:30 WIB:
--   - periode sampai 30 Des: tidak masuk
--   - periode sampai 31 Des: masuk
DO $$
DECLARE s int;
BEGIN
  SELECT COALESCE(SUM(total_harga), 0) INTO s FROM pesanan
  WHERE pembayaran = 'dibayar' AND data_uji = false
    AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2026-12-01' AND DATE '2026-12-30';
  IF s <> 14500 THEN RAISE EXCEPTION 'FAIL batas 30 Des: %, seharusnya 14500', s; END IF;
  RAISE NOTICE 'PASS: pembayaran 31 Des 23:30 WIB tidak masuk periode yang berakhir 30 Des';
END $$;

-- Batas tengah malam WIB. Pembayaran 1 Jan 00:30 WIB sama dengan 31 Des 17:30 UTC.
-- Query yang salah zona waktu akan memasukkannya ke Desember. Query yang benar tidak.
DO $$
DECLARE dec_s int; jan_s int;
BEGIN
  INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga, pembayaran, dibayar_pada, dibuat_pada)
  VALUES (gen_random_uuid(), 'Tengah Malam', 'E05', 1000, 'dibayar', '2027-01-01 00:30:00+07', '2027-01-01 00:00:00+07');

  SELECT COALESCE(SUM(total_harga), 0) INTO dec_s FROM pesanan
  WHERE pembayaran = 'dibayar' AND data_uji = false
    AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2026-12-01' AND DATE '2026-12-31';
  SELECT COALESCE(SUM(total_harga), 0) INTO jan_s FROM pesanan
  WHERE pembayaran = 'dibayar' AND data_uji = false
    AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN DATE '2027-01-01' AND DATE '2027-01-31';

  IF dec_s <> 22000 THEN RAISE EXCEPTION 'FAIL: pembayaran 1 Jan 00:30 WIB masuk Desember (%)', dec_s; END IF;
  IF jan_s <> 1000 THEN RAISE EXCEPTION 'FAIL: pembayaran 1 Jan 00:30 WIB tidak masuk Januari (%)', jan_s; END IF;
  RAISE NOTICE 'PASS: batas tengah malam WIB benar (1 Jan 00:30 WIB masuk Januari, bukan Desember)';
END $$;

ROLLBACK;
