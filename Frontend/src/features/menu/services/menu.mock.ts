import type { MenuItem } from '@/types/menu'

/**
 * Data menu sementara (mock) — sesuai daftar resmi UMKM.
 * Nanti diganti dengan respons API pada Tahap 4 (API Integration).
 * Harga dalam Rupiah.
 */
export const MOCK_MENU: MenuItem[] = [
  // ── LAUK (11) ─────────────────────────────────────────
  { id: 'L01', nama: 'Gorengan', harga: 1500, kategori: 'lauk', foto: 'gorengan.jpg' },
  { id: 'L02', nama: 'Tempe Garit', harga: 2000, kategori: 'lauk', foto: 'tempegarit.jpg' },
  { id: 'L03', nama: 'Tahu Bacem', harga: 2500, kategori: 'lauk', foto: 'tahubacem.jpg' },
  { id: 'L04', nama: 'Tempe Bacem', harga: 2500, kategori: 'lauk', foto: 'tempebacem.jpg' },
  { id: 'L05', nama: 'Ayam Goreng', harga: 9500, kategori: 'lauk', foto: 'ayamgoreng.jpg' },
  { id: 'L06', nama: 'Ayam Bacem', harga: 12000, kategori: 'lauk', foto: 'ayambacem.jpg' },
  { id: 'L07', nama: 'Telur Balado', harga: 5000, kategori: 'lauk', foto: 'telurbalado.jpg' },
  { id: 'L08', nama: 'Semur Telur', harga: 6000, kategori: 'lauk', foto: 'semurtelur.jpg' },
  { id: 'L09', nama: 'Rempelo Ati', harga: 6000, kategori: 'lauk', foto: 'rempeloati.jpg' },
  { id: 'L10', nama: 'Bandeng Goreng', harga: 7500, kategori: 'lauk', foto: 'bandenggoreng.jpg' },
  { id: 'L11', nama: 'Pindang Balado', harga: 8000, kategori: 'lauk', foto: 'pindangbalado.jpg' },

  // ── SAYUR (7) ─────────────────────────────────────────
  { id: 'S01', nama: 'Oseng Tahu Toge', harga: 5000, kategori: 'sayur', foto: 'osengtahutoge.jpg' },
  { id: 'S02', nama: 'Oseng Terong', harga: 5000, kategori: 'sayur', foto: 'osengterong.jpg' },
  { id: 'S03', nama: 'Oseng Kulit Mlinjo', harga: 6000, kategori: 'sayur', foto: 'osengkulitmlinjo.jpg' },
  { id: 'S04', nama: 'Oseng Mie', harga: 5000, kategori: 'sayur', foto: 'osengmie.jpg' },
  { id: 'S05', nama: 'Kuah Lombok Ijo', harga: 7000, kategori: 'sayur', foto: 'kuahlombokijo.jpg' },
  { id: 'S06', nama: 'Kuah Bobor', harga: 5000, kategori: 'sayur', foto: 'kuahbabor.jpg' },
  { id: 'S07', nama: 'Sop Bening', harga: 5000, kategori: 'sayur', foto: 'sopbening.jpg' },
]
