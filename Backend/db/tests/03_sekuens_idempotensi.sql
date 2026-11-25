-- 03: nomor pesanan dan idempotensi (ON CONFLICT).
--
-- Batas uji: kasus ini berurutan, bukan balapan sungguhan. Permintaan yang
-- "kalah" disimulasikan dengan dua INSERT berturut-turut. Balapan dengan dua
-- koneksi diuji terpisah di rencana uji M2 (dokumen SKEMA bagian A.4, T-A2).

BEGIN;

-- Replay: pesanan yang sudah ada dicari dengan SELECT (langkah 0), tanpa INSERT.
-- Nomor sekuens tidak boleh naik.
DO $$
DECLARE
  id_awal text; id_ulang text; sebelum bigint; sesudah bigint;
BEGIN
  INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES ('aaaaaaaa-0000-4000-8000-000000000001', 'Replay', 'A01', 14500)
  RETURNING id INTO id_awal;

  SELECT last_value INTO sebelum FROM pesanan_nomor_seq;
  SELECT id INTO id_ulang FROM pesanan WHERE id_permintaan = 'aaaaaaaa-0000-4000-8000-000000000001';
  SELECT last_value INTO sesudah FROM pesanan_nomor_seq;

  IF id_ulang IS DISTINCT FROM id_awal THEN
    RAISE EXCEPTION 'FAIL replay: id % berbeda dari %', id_ulang, id_awal;
  END IF;
  IF sesudah <> sebelum THEN
    RAISE EXCEPTION 'FAIL replay: sekuens naik dari % ke %, seharusnya tetap', sebelum, sesudah;
  END IF;
  RAISE NOTICE 'PASS: replay (langkah 0) mengembalikan id yang sama tanpa menaikkan nomor';
END $$;

-- Dua permintaan identik berurutan: pemenang mendapat nomor, yang kalah dilewati
-- ON CONFLICT tetapi tetap memakan satu nomor sekuens.
DO $$
DECLARE
  pemenang text; kalah text; sebelum bigint; sesudah bigint; jumlah int;
BEGIN
  SELECT last_value INTO sebelum FROM pesanan_nomor_seq;

  INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'Sari', 'A01', 14500)
  ON CONFLICT (id_permintaan) DO NOTHING
  RETURNING id INTO pemenang;

  INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES ('bbbbbbbb-0000-4000-8000-000000000002', 'Sari', 'A01', 14500)
  ON CONFLICT (id_permintaan) DO NOTHING
  RETURNING id INTO kalah;

  SELECT last_value INTO sesudah FROM pesanan_nomor_seq;
  SELECT count(*) INTO jumlah FROM pesanan WHERE id_permintaan = 'bbbbbbbb-0000-4000-8000-000000000002';

  IF pemenang IS NULL THEN RAISE EXCEPTION 'FAIL: pemenang tidak mendapat id'; END IF;
  IF kalah IS NOT NULL THEN RAISE EXCEPTION 'FAIL: yang kalah seharusnya tanpa id, dapat %', kalah; END IF;
  IF jumlah <> 1 THEN RAISE EXCEPTION 'FAIL: % pesanan dengan id permintaan yang sama', jumlah; END IF;
  IF sesudah - sebelum <> 2 THEN
    RAISE EXCEPTION 'FAIL: sekuens naik %, seharusnya 2 (pemenang + yang kalah)', sesudah - sebelum;
  END IF;
  RAISE NOTICE 'PASS: ON CONFLICT menghasilkan satu pesanan, yang kalah memakan satu nomor';
END $$;

-- Format id tetap BE-NNNN setelah nomor melompat (tidak ada pemeriksaan rekap di sini).
DO $$
DECLARE id_baru text;
BEGIN
  INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES (gen_random_uuid(), 'Lanjut', 'A02', 1000)
  RETURNING id INTO id_baru;
  IF id_baru !~ '^BE-[0-9]{4,}$' THEN RAISE EXCEPTION 'FAIL: format id % tidak sesuai BE-NNNN', id_baru; END IF;
  RAISE NOTICE 'PASS: format id pesanan sesuai BE-NNNN (%)', id_baru;
END $$;

ROLLBACK;
