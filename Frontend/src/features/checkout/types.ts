/** Status pesanan sesuai kontrak API `/api/v1/pesanan`. */
export type StatusPesanan = 'masuk' | 'diproses' | 'selesai' | 'batal'

/** Status pembayaran pesanan. Pemasukan hanya dihitung dari `dibayar`. */
export type StatusPembayaran = 'belum' | 'dibayar'

/** Item pesanan yang sudah disalin dari menu saat pesanan dibuat. */
export interface ItemPesanan {
  menuId: string
  nama: string
  harga: number
  jumlah: number
  subtotal: number
}

/** Item yang dikirim klien — server yang menentukan nama, harga, dan subtotal. */
export interface ItemPermintaan {
  menuId: string
  jumlah: number
}

/** Data yang dikirim ke API pesanan (Tahap 4). */
export interface OrderPayload {
  /** UUID dari klien untuk mencegah pesanan ganda saat retry. */
  idPermintaan: string
  nama: string
  nomorMeja: string
  catatan?: string
  items: ItemPermintaan[]
}

/** Pesanan lengkap seperti yang dikembalikan API pemilik. */
export interface OrderResult {
  id: string
  idPermintaan: string
  nama: string
  nomorMeja: string
  catatan?: string
  items: ItemPesanan[]
  totalHarga: number
  status: StatusPesanan
  pembayaran: StatusPembayaran
  dibuatPada: string
  dibayarPada: string | null
}
