import { create } from 'zustand'
import type { CartItem, CartState } from '@/types/cart'
import type { MenuItem } from '@/types/menu'
import { simpanNomorMejaDariUrl } from '../lib/meja'

// MenuPage (halaman pendaratan QR) mengimpor store ini, sehingga ?table=A01
// tersimpan sebelum pelanggan pindah ke /cart atau /checkout.
simpanNomorMejaDariUrl()

/**
 * Store keranjang — implementasi awal dari Frontend Lead (Tahap 2).
 * Arya melanjutkan di features/cart/ (halaman cart, checkout, dsb).
 */
export const useCartStore = create<CartState>((set) => ({
  items: [],

  tambah: (menu: MenuItem) =>
    set((state) => {
      const ada = state.items.find((item) => item.itemId === menu.id)
      if (ada) {
        return {
          items: state.items.map((item) =>
            item.itemId === menu.id ? { ...item, jumlah: item.jumlah + 1 } : item,
          ),
        }
      }
      const baru: CartItem = {
        itemId: menu.id,
        nama: menu.nama,
        harga: menu.harga,
        jumlah: 1,
      }
      return { items: [...state.items, baru] }
    }),

  ubahJumlah: (itemId, jumlah) =>
    set((state) => ({
      items:
        jumlah <= 0
          ? state.items.filter((item) => item.itemId !== itemId)
          : state.items.map((item) => (item.itemId === itemId ? { ...item, jumlah } : item)),
    })),

  hapus: (itemId) =>
    set((state) => ({ items: state.items.filter((item) => item.itemId !== itemId) })),

  kosongkan: () => set({ items: [] }),
}))

/** Total jumlah seluruh item (dipakai badge "Pesananmu"). */
export function hitungTotalJumlah(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.jumlah, 0)
}

/** Total harga semua item. */
export function hitungTotalHarga(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.harga * item.jumlah, 0)
}
