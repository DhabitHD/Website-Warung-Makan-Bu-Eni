import type { MenuItem } from '@/types/menu'

/**
 * Data menu sementara (mock) — sesuai daftar resmi UMKM.
 * Nanti diganti dengan respons API pada Tahap 4 (API Integration).
 * Harga dalam Rupiah.
 */
export const MOCK_MENU: MenuItem[] = [
  // ── LAUK (11) ─────────────────────────────────────────
  { id: 'lauk-01', nama: 'Gorengan', harga: 1500, kategori: 'lauk', foto: 'gorengan.jpg' },
  { id: 'lauk-02', nama: 'Tempe Garit', harga: 2000, kategori: 'lauk', foto: 'tempegarit.jpg' },
  { id: 'lauk-03', nama: 'Tahu Bacem', harga: 2500, kategori: 'lauk', foto: 'tahubacem.jpg' },
  { id: 'lauk-04', nama: 'Tempe Bacem', harga: 2500, kategori: 'lauk', foto: 'tempebacem.jpg' },
  { id: 'lauk-05', nama: 'Ayam Goreng', harga: 9500, kategori: 'lauk', foto: 'ayamgoreng.jpg' },
  { id: 'lauk-06', nama: 'Ayam Bacem', harga: 12000, kategori: 'lauk', foto: 'ayambacem.jpg' },
  { id: 'lauk-07', nama: 'Telur Balado', harga: 5000, kategori: 'lauk', foto: 'telurbalado.jpg' },
  { id: 'lauk-08', nama: 'Semur Telur', harga: 6000, kategori: 'lauk', foto: 'semurtelur.jpg' },
  { id: 'lauk-09', nama: 'Rempelo Ati', harga: 6000, kategori: 'lauk', foto: 'rempeloati.jpg' },
  { id: 'lauk-10', nama: 'Bandeng Goreng', harga: 7500, kategori: 'lauk', foto: 'bandenggoreng.jpg' },
  { id: 'lauk-11', nama: 'Pindang Balado', harga: 8000, kategori: 'lauk', foto: 'pindangbalado.jpg' },

  // ── SAYUR (7) ─────────────────────────────────────────
  { id: 'sayur-01', nama: 'Oseng Tahu Toge', harga: 5000, kategori: 'sayur', foto: 'osengtahutoge.jpg' },
  { id: 'sayur-02', nama: 'Oseng Terong', harga: 5000, kategori: 'sayur', foto: 'osengterong.jpg' },
  { id: 'sayur-03', nama: 'Oseng Kulit Mlinjo', harga: 6000, kategori: 'sayur', foto: 'osengkulitmlinjo.jpg' },
  { id: 'sayur-04', nama: 'Oseng Mie', harga: 5000, kategori: 'sayur', foto: 'osengmie.jpg' },
  { id: 'sayur-05', nama: 'Kuah Lombok Ijo', harga: 7000, kategori: 'sayur', foto: 'kuahlombokijo.jpg' },
  { id: 'sayur-06', nama: 'Kuah Bobor', harga: 5000, kategori: 'sayur', foto: 'kuahbabor.jpg' },
  { id: 'sayur-07', nama: 'Sop Bening', harga: 5000, kategori: 'sayur', foto: 'sopbening.jpg' },
]
