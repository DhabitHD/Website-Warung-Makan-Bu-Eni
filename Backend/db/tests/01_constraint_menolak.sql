-- 01: constraint menolak data yang salah.
-- Setiap kasus harus gagal dengan SQLSTATE yang diharapkan (lihat uji_gagal).
-- 23514 = check_violation, 23505 = unique_violation, 23503 = foreign_key_violation.

BEGIN;
\o /dev/null

-- pesanan
SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga, pembayaran)
  VALUES (gen_random_uuid(), 'Uji', 'A1', 1000, 'dibayar')$s$, '23514', 'dibayar tanpa dibayar_pada');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga, status, pembayaran, dibayar_pada)
  VALUES (gen_random_uuid(), 'Uji', 'A1', 1000, 'batal', 'dibayar', now())$s$, '23514', 'status batal tetapi sudah dibayar');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES ('11111111-1111-4111-8111-111111111111', 'Duplikat', 'A1', 1000)$s$, '23505', 'id_permintaan duplikat');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES (gen_random_uuid(), 'Uji', 'A 9!', 1000)$s$, '23514', 'nomor_meja berisi spasi dan tanda seru');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES (gen_random_uuid(), 'Uji', 'A1', -1)$s$, '23514', 'total_harga negatif');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga, status)
  VALUES (gen_random_uuid(), 'Uji', 'A1', 1000, 'entah')$s$, '23514', 'status di luar daftar');

SELECT uji_gagal($s$INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, total_harga)
  VALUES (gen_random_uuid(), 'U', 'A1', 1000)$s$, '23514', 'nama pelanggan kurang dari 2 karakter');

-- item_pesanan
SELECT uji_gagal($s$INSERT INTO item_pesanan (pesanan_id, menu_id, nama, harga, jumlah)
  SELECT id, 'L05', 'Ayam Goreng', 9500, 0 FROM pesanan LIMIT 1$s$, '23514', 'jumlah item nol');

SELECT uji_gagal($s$INSERT INTO item_pesanan (pesanan_id, menu_id, nama, harga, jumlah)
  SELECT id, 'L05', 'Ayam Goreng', 9500, 51 FROM pesanan LIMIT 1$s$, '23514', 'jumlah item di atas 50');

SELECT uji_gagal($s$INSERT INTO item_pesanan (pesanan_id, menu_id, nama, harga, jumlah)
  VALUES ('BE-9999', 'L05', 'Ayam Goreng', 9500, 1)$s$, '23503', 'item untuk pesanan yang tidak ada');

-- menu
SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('L90', 'Nasi', 'nasi', 1000, 'a.jpg')$s$, '23514', 'kategori selain lauk/sayur');

SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('L91', 'Nasi', 'lauk', -5, 'a.jpg')$s$, '23514', 'harga menu negatif');

SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('L92', 'Nasi', 'lauk', 10000001, 'a.jpg')$s$, '23514', 'harga menu di atas 10 juta');

SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('L93', 'N', 'lauk', 1000, 'a.jpg')$s$, '23514', 'nama menu kurang dari 2 karakter');

-- id menu harus sesuai menu_id dataset (L01–L11, S01–S07)
SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('lauk-05', 'Ayam Goreng', 'lauk', 9500, 'a.jpg')$s$, '23514', 'id format lama lauk-05 ditolak');

SELECT uji_gagal($s$INSERT INTO menu (id, nama, kategori, harga, foto)
  VALUES ('L5', 'Ayam Goreng', 'lauk', 9500, 'a.jpg')$s$, '23514', 'id L5 tanpa dua digit ditolak');

-- pengeluaran
SELECT uji_gagal($s$INSERT INTO pengeluaran (keterangan, nominal, tanggal)
  VALUES ('Nol', 0, DATE '2026-12-01')$s$, '23514', 'pengeluaran nominal nol');

SELECT uji_gagal($s$INSERT INTO pengeluaran (keterangan, nominal, tanggal)
  VALUES ('Negatif', -100, DATE '2026-12-01')$s$, '23514', 'pengeluaran nominal negatif');

SELECT uji_gagal($s$INSERT INTO pengeluaran (keterangan, nominal, tanggal)
  VALUES ('Besar', 100000001, DATE '2026-12-01')$s$, '23514', 'pengeluaran di atas Rp100 juta');

SELECT uji_gagal($s$INSERT INTO pengeluaran (keterangan, nominal, tanggal)
  VALUES ('Tanpa tanggal', 1000, NULL)$s$, '23502', 'pengeluaran tanpa tanggal');

-- riwayat_rekomendasi
SELECT uji_gagal($s$INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, total_harga, sumber_model, kode_alasan)
  VALUES ('sedang', 1, 15000, '{L05}', 9500, 'gagal', 'AI_TIDAK_TERSEDIA')$s$, '23514', 'rekomendasi gagal tetapi punya hasil');

SELECT uji_gagal($s$INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, total_harga, sumber_model)
  VALUES ('sedang', 1, 15000, '{}', NULL, 'fine-tune')$s$, '23514', 'rekomendasi berhasil tanpa hasil');

SELECT uji_gagal($s$INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, sumber_model)
  VALUES ('sedang', 3, 15000, '{L05}', 'fine-tune')$s$, '23514', 'tingkat pedas di luar 0-2');

SELECT uji_gagal($s$INSERT INTO riwayat_rekomendasi (suasana_hati, tingkat_pedas, anggaran, hasil_menu_ids, total_harga, sumber_model)
  VALUES ('sedang', 1, 0, '{L05}', 9500, 'fine-tune')$s$, '23514', 'anggaran nol');

ROLLBACK;
