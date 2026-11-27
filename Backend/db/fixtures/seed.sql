-- Data contoh untuk pengujian skema. Dijalankan sekali setelah schema.sql.
-- Harga menu diambil dari katalog resmi (Frontend/src/features/menu/services/menu.mock.ts).
-- Id pesanan dibuat oleh sekuens (BE-0001, BE-0002, ...), tidak diisi manual.
-- Transaksi uji diberi data_uji = true agar tidak masuk rekap.

INSERT INTO menu (id, nama, kategori, harga, foto, tersedia) VALUES
  ('L01', 'Gorengan',      'lauk',  1500, 'gorengan.jpg',     true),
  ('L02', 'Tempe Garit',   'lauk',  2000, 'tempegarit.jpg',   true),
  ('L05', 'Ayam Goreng',   'lauk',  9500, 'ayamgoreng.jpg',   true),
  ('L10', 'Bandeng Goreng','lauk',  7500, 'bandenggoreng.jpg', true),
  ('S01','Oseng Tahu Toge','sayur', 5000, 'osengtahutoge.jpg', false),
  ('S07','Sop Bening',    'sayur', 5000, 'sopbening.jpg',    true);

-- P1: dibuat 5 Des, dibayar 5 Des (WIB). Termasuk rekap Desember.
INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, status, pembayaran, total_harga,
                     dibuat_pada, dibayar_pada)
VALUES ('11111111-1111-4111-8111-111111111111', 'Toni', 'A01', 'selesai', 'dibayar', 14500,
        '2026-12-05 12:00:00+07', '2026-12-05 12:30:00+07');

-- P2: dibuat 31 Des 23:00 WIB, dibayar 31 Des 23:30 WIB. Harus masuk rekap 31 Des, bukan 1 Jan.
INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, status, pembayaran, total_harga,
                     dibuat_pada, dibayar_pada)
VALUES ('22222222-2222-4222-8222-222222222222', 'Sari', 'B02', 'masuk', 'dibayar', 7500,
        '2026-12-31 23:00:00+07', '2026-12-31 23:30:00+07');

-- P3: belum dibayar. Tidak boleh masuk pemasukan.
INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, status, pembayaran, total_harga,
                     dibuat_pada)
VALUES ('33333333-3333-4333-8333-333333333333', 'Budi', 'C03', 'masuk', 'belum', 3000,
        '2026-12-10 09:00:00+07');

-- P4: data uji. Tidak boleh masuk rekap apa pun.
INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, status, pembayaran, total_harga,
                     data_uji, dibuat_pada, dibayar_pada)
VALUES ('44444444-4444-4444-8444-444444444444', 'Uji', 'T01', 'selesai', 'dibayar', 99000,
        true, '2026-12-06 10:00:00+07', '2026-12-06 10:05:00+07');

-- P5: dibatalkan. Tidak masuk pemasukan maupun jumlah pesanan masuk.
INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, status, pembayaran, total_harga,
                     dibuat_pada)
VALUES ('55555555-5555-4555-8555-555555555555', 'Dewi', 'D04', 'batal', 'belum', 5000,
        '2026-12-02 08:00:00+07');

-- Item: nama dan harga disalin dari menu saat pesanan dibuat.
INSERT INTO item_pesanan (pesanan_id, menu_id, nama, harga, jumlah)
SELECT p.id, 'L05', 'Ayam Goreng', 9500, 1 FROM pesanan p WHERE p.id_permintaan = '11111111-1111-4111-8111-111111111111'
UNION ALL
SELECT p.id, 'S07', 'Sop Bening', 5000, 1 FROM pesanan p WHERE p.id_permintaan = '11111111-1111-4111-8111-111111111111'
UNION ALL
SELECT p.id, 'L10', 'Bandeng Goreng', 7500, 1 FROM pesanan p WHERE p.id_permintaan = '22222222-2222-4222-8222-222222222222'
UNION ALL
SELECT p.id, 'L01', 'Gorengan', 1500, 2 FROM pesanan p WHERE p.id_permintaan = '33333333-3333-4333-8333-333333333333';

-- Pengeluaran: Rp5.000 (masuk rekap) dan contoh uji Rp800.000 (tidak masuk rekap).
INSERT INTO pengeluaran (keterangan, nominal, tanggal) VALUES
  ('Beli bahan baku', 5000, '2026-12-03');
INSERT INTO pengeluaran (keterangan, nominal, tanggal, data_uji) VALUES
  ('Contoh uji', 800000, '2026-12-03', true);
