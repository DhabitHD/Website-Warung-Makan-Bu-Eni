import { useMemo } from 'react'
import { useOrderStore } from '../store/order-store'

/** Daftar pesanan terbaru lebih dulu. */
export function useDaftarPesanan() {
  const pesanan = useOrderStore((state) => state.pesanan)

  return useMemo(
    () => [...pesanan].sort((a, b) => b.dibuatPada.localeCompare(a.dibuatPada)),
    [pesanan],
  )
}

/** Satu pesanan berdasarkan id, atau null bila tidak ditemukan. */
export function usePesanan(id: string | undefined) {
  const pesanan = useOrderStore((state) => state.pesanan)

  return useMemo(
    () => (id ? (pesanan.find((item) => item.id === id) ?? null) : null),
    [pesanan, id],
  )
}
