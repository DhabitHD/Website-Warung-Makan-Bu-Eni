/**
 * Tipe data keranjang — kontrak awal dari Frontend Lead.
 * Arya melanjutkan implementasinya di features/cart/.
 */
import type { MenuItem } from './menu'

export interface CartItem {
  /** id MenuItem yang dipilih. */
  itemId: string
  /** Salinan nama agar keranjang tetap tampil walau menu berubah. */
  nama: string
  /** Salinan harga satuan saat ditambahkan. */
  harga: number
  /** Jumlah pesanan, minimal 1. */
  jumlah: number
}

export interface CartState {
  items: CartItem[]
  /** Tambah item baru, atau tambah jumlahnya bila sudah ada. */
  tambah: (menu: MenuItem) => void
  /** Ubah jumlah item; nilai <= 0 akan menghapus item. */
  ubahJumlah: (itemId: string, jumlah: number) => void
  hapus: (itemId: string) => void
  kosongkan: () => void
}
