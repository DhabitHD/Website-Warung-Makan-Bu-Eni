-- 05: kunci optimistik untuk status dan pembayaran (SKEMA bagian 4.2).
-- Pesanan uji: P3 (fixtures/seed.sql), awalnya belum dibayar dan masih masuk.

BEGIN;
\o /dev/null

-- Nilai lama tidak cocok: 0 baris, tanpa galat. Aplikasi membaca ulang lalu memutuskan balasannya.
DO $$
DECLARE n int;
BEGIN
  UPDATE pesanan SET pembayaran = 'dibayar', dibayar_pada = now()
  WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND pembayaran = 'dibayar';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL nilai lama salah: % baris berubah, seharusnya 0', n; END IF;
  RAISE NOTICE 'PASS: pembayaran dengan nilai lama salah tidak mengubah apa pun (0 baris)';
END $$;

-- Nilai lama cocok: 1 baris, dibayar_pada terisi.
DO $$
DECLARE n int; waktu timestamptz;
BEGIN
  UPDATE pesanan SET pembayaran = 'dibayar', dibayar_pada = now()
  WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND pembayaran = 'belum' AND status <> 'batal'
  RETURNING dibayar_pada INTO waktu;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 OR waktu IS NULL THEN RAISE EXCEPTION 'FAIL pembayaran sah: baris %, dibayar_pada %', n, waktu; END IF;
  RAISE NOTICE 'PASS: pembayaran dengan nilai lama benar diterima dan dibayar_pada terisi';
END $$;

-- Pembatalan dengan cek pembayaran di WHERE (rancangan final): 0 baris, tanpa galat database.
DO $$
DECLARE n int;
BEGIN
  UPDATE pesanan SET status = 'batal', diperbarui_pada = now()
  WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND status = 'masuk'
    AND NOT ('batal' = 'batal' AND pembayaran = 'dibayar');
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 0 THEN RAISE EXCEPTION 'FAIL: pesanan dibayar ikut dibatalkan (% baris)', n; END IF;
  RAISE NOTICE 'PASS: pembatalan pesanan yang sudah dibayar ditahan di WHERE (0 baris)';
END $$;

-- Tanpa cek di WHERE (rancangan awal): database menolak dengan CHECK, bukan galat generik.
SELECT uji_gagal(
  $s$UPDATE pesanan SET status = 'batal' WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND status = 'masuk'$s$,
  '23514',
  'pembatalan tanpa cek pembayaran ditolak constraint (23514)'
);

-- Setelah pembayaran dikembalikan ke belum, pembatalan berhasil.
DO $$
DECLARE n int; st text;
BEGIN
  UPDATE pesanan SET pembayaran = 'belum', dibayar_pada = NULL
  WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND pembayaran = 'dibayar';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN RAISE EXCEPTION 'FAIL: pengembalian pembayaran % baris', n; END IF;

  UPDATE pesanan SET status = 'batal', diperbarui_pada = now()
  WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND status = 'masuk'
    AND NOT ('batal' = 'batal' AND pembayaran = 'dibayar')
  RETURNING status INTO st;
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 OR st <> 'batal' THEN RAISE EXCEPTION 'FAIL: pembatalan setelah belum dibayar: % baris', n; END IF;
  RAISE NOTICE 'PASS: setelah pembayaran dikembalikan ke belum, pesanan bisa dibatalkan';
END $$;

-- Pembayaran yang sudah 'dibayar' tidak boleh berstatus batal: constraint menahan.
SELECT uji_gagal(
  $s$UPDATE pesanan SET pembayaran = 'dibayar', dibayar_pada = now()
     WHERE id_permintaan = '33333333-3333-4333-8333-333333333333' AND status = 'batal'$s$,
  '23514',
  'pesanan batal tidak boleh ditandai dibayar (23514)'
);

ROLLBACK;
