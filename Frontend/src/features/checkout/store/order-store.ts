import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { MOCK_PESANAN } from '../services/order.mock'
import type { OrderResult } from '../types'

export interface OrderState {
  /** Seluruh pesanan — sumber data tunggal halaman admin. */
  pesanan: OrderResult[]
  /** Tambah pesanan baru dari checkout. */
  tambah: (pesanan: OrderResult) => void
  /** Perbarui status/pembayaran pesanan berdasarkan id. */
  perbarui: (
    id: string,
    perubahan: Partial<Pick<OrderResult, 'status' | 'pembayaran' | 'dibayarPada'>>,
  ) => void
}

/**
 * Store pesanan (mock sampai API Tahap 4).
 * Disimpan di localStorage agar perubahan status/pembayaran bertahan saat refresh.
 * Kunci baru `warung.pesanan.v1` menghindari benturan dengan data pesanan lama.
 */
export const useOrderStore = create<OrderState>()(
  persist(
    (set) => ({
      pesanan: MOCK_PESANAN,

      tambah: (pesanan) =>
        set((state) => ({ pesanan: [...state.pesanan, pesanan] })),

      perbarui: (id, perubahan) =>
        set((state) => ({
          pesanan: state.pesanan.map((item) =>
            item.id === id ? { ...item, ...perubahan } : item,
          ),
        })),
    }),
    {
      name: 'warung.pesanan.v1',
      version: 1,
      partialize: (state) => ({ pesanan: state.pesanan }),
    },
  ),
)
