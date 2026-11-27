import type { KategoriMenu, MenuItem } from '@/types/menu'

/** Awalan id menu: L untuk lauk, S untuk sayur (sesuai menu_id di dataset). */
export function awalanIdMenu(kategori: KategoriMenu): 'L' | 'S' {
  return kategori === 'lauk' ? 'L' : 'S'
}

/**
 * Id menu baru: awalan kategori + nomor berikutnya, dua digit (L12, S08).
 * Mock saja; server membuat id ini lewat sekuens pada Tahap 4.
 */
export function buatIdMenu(kategori: KategoriMenu, daftar: MenuItem[]): string {
  const awalan = awalanIdMenu(kategori)
  const nomorTerbesar = daftar
    .filter((menu) => menu.id.startsWith(awalan))
    .map((menu) => Number(menu.id.slice(1)))
    .filter((nomor) => Number.isInteger(nomor))
    .reduce((maks, nomor) => Math.max(maks, nomor), 0)

  return `${awalan}${String(nomorTerbesar + 1).padStart(2, '0')}`
}
