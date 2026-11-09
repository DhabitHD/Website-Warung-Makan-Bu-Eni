import type { CartItem } from '@/types/cart'

/** Data yang dikirim ke API pesanan (Tahap 4). */
export interface OrderPayload {
  nama: string
  nomorMeja: string
  catatan?: string
  items: CartItem[]
  totalHarga: number
}

/** Pesanan yang sudah diterima warung. */
export interface OrderResult extends OrderPayload {
  id: string
  dibuatPada: string
  status: 'diterima'
}
