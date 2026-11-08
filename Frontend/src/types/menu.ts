/**
 * Tipe data menu — kontrak bersama Frontend (Dhabit & Arya).
 * Jangan mengubah struktur ini tanpa koordinasi.
 */

export type KategoriMenu = 'lauk' | 'sayur'

export interface MenuItem {
  /** Unik, dipakai sebagai key di keranjang. */
  id: string
  /** Nama tampilan, contoh: "Tempe Garit". */
  nama: string
  /** Harga satuan dalam Rupiah, contoh: 2000. */
  harga: number
  kategori: KategoriMenu
  /** Nama file foto, contoh: "tempegarit.jpg". */
  foto: string
  /** Deskripsi singkat (opsional). */
  deskripsi?: string
}

/** Daftar kategori untuk filter, 'semua' berarti tanpa filter. */
export type FilterKategori = KategoriMenu | 'semua'
