/** Baris database (snake_case) → bentuk JSON kontrak (camelCase). KONTRAK-API bagian 1.4. */

export interface MenuRow {
  id: string
  nama: string
  kategori: 'lauk' | 'sayur'
  harga: number
  porsi: string | null
  foto: string
  keterangan_rasa: string | null
  tersedia: boolean
}

export interface PesananRow {
  id: string
  nama_pelanggan: string
  nomor_meja: string | null
  catatan: string | null
  status: 'masuk' | 'diproses' | 'selesai' | 'batal'
  pembayaran: 'belum' | 'dibayar'
  total_harga: number
  dibuat_pada: Date
  dibayar_pada: Date | null
}

export interface ItemRow {
  pesanan_id: string
  menu_id: string | null
  nama: string
  harga: number
  jumlah: number
  subtotal: number
}

export function petaMenu(baris: MenuRow) {
  return {
    id: baris.id,
    nama: baris.nama,
    kategori: baris.kategori,
    harga: Number(baris.harga),
    porsi: baris.porsi,
    foto: baris.foto,
    keteranganRasa: baris.keterangan_rasa,
    tersedia: baris.tersedia,
  }
}

export function petaPesanan(baris: PesananRow, items: ItemRow[]) {
  return {
    id: baris.id,
    nama: baris.nama_pelanggan,
    nomorMeja: baris.nomor_meja,
    catatan: baris.catatan,
    status: baris.status,
    pembayaran: baris.pembayaran,
    totalHarga: Number(baris.total_harga),
    dibuatPada: baris.dibuat_pada.toISOString(),
    dibayarPada: baris.dibayar_pada ? baris.dibayar_pada.toISOString() : null,
    items: items.map((item) => ({
      menuId: item.menu_id,
      nama: item.nama,
      harga: Number(item.harga),
      jumlah: Number(item.jumlah),
      subtotal: Number(item.subtotal),
    })),
  }
}
