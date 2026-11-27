-- 02: data yang sah diterima, dan nilai default bekerja.

BEGIN;

DO $$
DECLARE n int;
BEGIN
  -- Data contoh sudah masuk: 6 menu, 5 pesanan, 1 pengeluaran nyata + 1 uji.
  SELECT count(*) INTO n FROM menu;
  IF n <> 6 THEN RAISE EXCEPTION 'FAIL: jumlah menu contoh %, seharusnya 6', n; END IF;
  SELECT count(*) INTO n FROM pesanan;
  IF n <> 5 THEN RAISE EXCEPTION 'FAIL: jumlah pesanan contoh %, seharusnya 5', n; END IF;
  RAISE NOTICE 'PASS: data contoh termuat (6 menu, 5 pesanan)';
END $$;

-- Subtotal kolom terhitung: P1 = Ayam Goreng 9500 + Sop Bening 5000 = 14500 = total_harga.
DO $$
DECLARE s int; t int;
BEGIN
  SELECT sum(ip.subtotal), max(p.total_harga) INTO s, t
  FROM item_pesanan ip JOIN pesanan p ON p.id = ip.pesanan_id
  WHERE p.id_permintaan = '11111111-1111-4111-8111-111111111111';
  IF s <> 14500 OR t <> 14500 THEN
    RAISE EXCEPTION 'FAIL: subtotal %, total %, seharusnya keduanya 14500', s, t;
  END IF;
  RAISE NOTICE 'PASS: subtotal item sama dengan total pesanan (14500)';
END $$;

-- Pesanan tanpa nomor meja diterima (nomor_meja opsional).
INSERT INTO pesanan (id_permintaan, nama_pelanggan, total_harga)
VALUES (gen_random_uuid(), 'Tanpa Meja', 1000);
DO $$ BEGIN RAISE NOTICE 'PASS: pesanan tanpa nomor meja diterima'; END $$;

-- Pesanan dibatalkan tanpa pembayaran diterima (pembayaran default belum).
INSERT INTO pesanan (id_permintaan, nama_pelanggan, total_harga, status)
VALUES (gen_random_uuid(), 'Batal Saja', 1000, 'batal');
DO $$ BEGIN RAISE NOTICE 'PASS: pesanan batal berstatus belum dibayar diterima'; END $$;

-- Nilai default: status masuk, pembayaran belum, tersedia true, data_uji false.
DO $$
DECLARE r record;
BEGIN
  INSERT INTO pesanan (id_permintaan, nama_pelanggan, total_harga)
  VALUES (gen_random_uuid(), 'Default', 1000)
  RETURNING status, pembayaran, data_uji, dibayar_pada INTO r;
  IF r.status <> 'masuk' OR r.pembayaran <> 'belum' OR r.data_uji OR r.dibayar_pada IS NOT NULL THEN
    RAISE EXCEPTION 'FAIL: nilai default pesanan salah: %', r;
  END IF;
  RAISE NOTICE 'PASS: nilai default pesanan (masuk, belum, data_uji false)';
END $$;

DO $$
DECLARE menu_tersedia boolean;
BEGIN
  INSERT INTO menu (id, nama, kategori, harga, foto) VALUES ('S90', 'Uji Menu', 'sayur', 0, 'u.jpg')
  RETURNING tersedia INTO menu_tersedia;
  IF NOT menu_tersedia THEN RAISE EXCEPTION 'FAIL: menu baru tidak tersedia secara default'; END IF;
  RAISE NOTICE 'PASS: menu baru tersedia secara default, harga 0 diterima';
END $$;

-- Riwayat rekomendasi yang sah: berhasil dan gagal.
INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, total_harga, alasan, sumber_model)
VALUES ('sedang', 1, 15000, '{L02,S07}', 7000, 'Uji', 'fine-tune');
INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, sumber_model, kode_alasan, latensi_ms)
VALUES ('sedih', 0, 2000, '{}', 'gagal', 'ANGGARAN_TERLALU_RENDAH', 8001);
DO $$ BEGIN RAISE NOTICE 'PASS: riwayat berhasil dan gagal diterima'; END $$;

-- Pengeluaran sah.
INSERT INTO pengeluaran (keterangan, nominal, tanggal) VALUES ('Uji', 1, DATE '2026-12-01');
DO $$ BEGIN RAISE NOTICE 'PASS: pengeluaran nominal 1 (batas bawah) diterima'; END $$;

ROLLBACK;
