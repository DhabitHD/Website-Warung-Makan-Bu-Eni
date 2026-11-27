-- Skema PostgreSQL v3 — Warung Makan Bu Eni.
-- Diambil dari docs/SKEMA-POSTGRESQL.md bagian 3 (DDL). Jalankan pada database kosong.

CREATE SEQUENCE pesanan_nomor_seq START 1;

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

CREATE TABLE item_pesanan (
  id          BIGSERIAL PRIMARY KEY,
  pesanan_id  TEXT NOT NULL REFERENCES pesanan(id) ON DELETE CASCADE,
  menu_id     TEXT REFERENCES menu(id) ON DELETE SET NULL, -- NULL bila menu sudah dihapus
  nama        TEXT NOT NULL,                               -- salinan nama saat dipesan
  harga       INTEGER NOT NULL CHECK (harga >= 0),         -- salinan harga saat dipesan
  jumlah      INTEGER NOT NULL CHECK (jumlah BETWEEN 1 AND 50),
  subtotal    INTEGER GENERATED ALWAYS AS (harga * jumlah) STORED
);

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

CREATE INDEX idx_pesanan_dibuat_pada  ON pesanan (dibuat_pada);
CREATE INDEX idx_pesanan_status       ON pesanan (status);
CREATE INDEX idx_pesanan_dibayar      ON pesanan (dibayar_pada) WHERE pembayaran = 'dibayar';
CREATE INDEX idx_item_pesanan_pesanan ON item_pesanan (pesanan_id);
CREATE INDEX idx_item_pesanan_menu    ON item_pesanan (menu_id);
CREATE INDEX idx_pengeluaran_tanggal  ON pengeluaran (tanggal);
CREATE INDEX idx_menu_kategori        ON menu (kategori);
CREATE INDEX idx_riwayat_dibuat       ON riwayat_rekomendasi (dibuat_pada);

