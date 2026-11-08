import { useMemo, useState } from 'react'
import { MOCK_MENU } from '../services/menu.mock'
import type { FilterKategori, MenuItem } from '@/types/menu'

const LABEL_KATEGORI: Record<FilterKategori, string> = {
  semua: 'Semua',
  lauk: 'Lauk',
  sayur: 'Sayur',
}

export interface GroupedMenu {
  /** Hasil pencarian & filter saat ini. */
  hasil: MenuItem[]
  /** Group per kategori yang tidak kosong, untuk section "01 / Lauk". */
  grup: { kategori: Exclude<FilterKategori, 'semua'>; label: string; nomor: string; menu: MenuItem[] }[]
  pencarian: string
  setPencarian: (value: string) => void
  kategori: FilterKategori
  setKategori: (value: FilterKategori) => void
  totalSemua: number
}

/**
 * State & logika filter menu: pencarian (nama) + filter kategori.
 * Data masih mock; Tahap 4 mengganti sumber datanya dengan API.
 */
export function useMenuFilter(): GroupedMenu {
  const [pencarian, setPencarian] = useState('')
  const [kategori, setKategori] = useState<FilterKategori>('semua')

  const hasil = useMemo(() => {
    const kata = pencarian.trim().toLowerCase()
    return MOCK_MENU.filter((menu) => {
      const cocokKategori = kategori === 'semua' || menu.kategori === kategori
      const cocokPencarian = kata === '' || menu.nama.toLowerCase().includes(kata)
      return cocokKategori && cocokPencarian
    })
  }, [pencarian, kategori])

  const grup = useMemo(() => {
    const urutan: Exclude<FilterKategori, 'semua'>[] = ['lauk', 'sayur']
    return urutan
      .map((kat, index) => ({
        kategori: kat,
        label: LABEL_KATEGORI[kat],
        // Nomor tetap: Lauk selalu 01, Sayur selalu 02
        nomor: String(index + 1).padStart(2, '0'),
        menu: hasil.filter((menu) => menu.kategori === kat),
      }))
      .filter((g) => g.menu.length > 0)
  }, [hasil])

  return {
    hasil,
    grup,
    pencarian,
    setPencarian,
    kategori,
    setKategori,
    totalSemua: MOCK_MENU.length,
  }
}
