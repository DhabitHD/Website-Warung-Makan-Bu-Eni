import { create } from 'zustand'
import { MOCK_MENU } from '../services/menu.mock'
import type { MenuItem } from '@/types/menu'

export interface MenuState {
  /** Seluruh menu — sumber data tunggal halaman pelanggan & admin. */
  items: MenuItem[]
  /** Tambah menu baru, atau timpa bila `id` sudah ada (mode edit). */
  simpan: (menu: MenuItem) => void
  /** Hapus menu berdasarkan id. */
  hapus: (id: string) => void
  /** Balik status ketersediaan: tersedia ↔ habis. */
  toggleKetersediaan: (id: string) => void
}

/**
 * Store menu (Fase 2 — MILIK LEAD).
 * Data masih mock; Tahap 4 mengganti aksi ini dengan mutasi TanStack Query
 * ke API tanpa mengubah pemanggilnya.
 */
export const useMenuStore = create<MenuState>((set) => ({
  items: MOCK_MENU,

  simpan: (menu) =>
    set((state) => {
      const ada = state.items.some((item) => item.id === menu.id)
      if (ada) {
        return { items: state.items.map((item) => (item.id === menu.id ? menu : item)) }
      }
      return { items: [...state.items, menu] }
    }),

  hapus: (id) => set((state) => ({ items: state.items.filter((item) => item.id !== id) })),

  toggleKetersediaan: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, tersedia: item.tersedia === false } : item,
      ),
    })),
}))

/** Menu dianggap tersedia bila `tersedia` bukan `false` (kompatibel data lama). */
export function apakahTersedia(menu: MenuItem): boolean {
  return menu.tersedia !== false
}
