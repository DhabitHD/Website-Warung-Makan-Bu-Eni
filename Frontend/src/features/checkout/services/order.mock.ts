import { MOCK_MENU } from '@/features/menu/services/menu.mock'
import type {
  ItemPesanan,
  OrderResult,
  StatusPembayaran,
  StatusPesanan,
} from '../types'

interface SeedPesanan {
  id: string
  nama: string
  nomorMeja: string
  catatan?: string
  item: Array<[menuId: string, jumlah: number]>
  status: StatusPesanan
  pembayaran: StatusPembayaran
  dibuatPada: string
  dibayarPada?: string
}

function buatItem(menuId: string, jumlah: number): ItemPesanan {
  const menu = MOCK_MENU.find((item) => item.id === menuId)
  if (!menu) {
    throw new Error(`Menu ${menuId} tidak ditemukan di MOCK_MENU.`)
  }

  return {
    menuId: menu.id,
    nama: menu.nama,
    harga: menu.harga,
    jumlah,
    subtotal: menu.harga * jumlah,
  }
}

function hitungTotal(items: ItemPesanan[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0)
}

/** Waktu relatif terhadap hari ini agar dashboard punya data "hari ini". */
function waktu(hariLalu: number, jam: number, menit = 0): string {
  const tanggal = new Date()
  tanggal.setDate(tanggal.getDate() - hariLalu)
  tanggal.setHours(jam, menit, 0, 0)
  return tanggal.toISOString()
}

function buatPesanan(seed: SeedPesanan): OrderResult {
  const items = seed.item.map(([menuId, jumlah]) => buatItem(menuId, jumlah))

  return {
    id: seed.id,
    idPermintaan: `seed-${seed.id.toLowerCase()}`,
    nama: seed.nama,
    nomorMeja: seed.nomorMeja,
    catatan: seed.catatan,
    items,
    totalHarga: hitungTotal(items),
    status: seed.status,
    pembayaran: seed.pembayaran,
    dibuatPada: seed.dibuatPada,
    dibayarPada: seed.dibayarPada ?? null,
  }
}

/**
 * Pesanan contoh untuk demo admin sebelum API tersedia.
 * Tanggal dibuat relatif terhadap hari ini agar dashboard tidak kosong.
 */
export const MOCK_PESANAN: OrderResult[] = [
  buatPesanan({
    id: 'BE-0001',
    nama: 'Toni',
    nomorMeja: 'A01',
    catatan: 'Tanpa sambal',
    item: [
      ['lauk-05', 1],
      ['sayur-07', 1],
    ],
    status: 'masuk',
    pembayaran: 'belum',
    dibuatPada: waktu(0, 10, 15),
  }),
  buatPesanan({
    id: 'BE-0002',
    nama: 'Siti',
    nomorMeja: 'A02',
    item: [
      ['lauk-02', 1],
      ['sayur-02', 1],
    ],
    status: 'diproses',
    pembayaran: 'belum',
    dibuatPada: waktu(0, 9, 40),
  }),
  buatPesanan({
    id: 'BE-0003',
    nama: 'Budi',
    nomorMeja: 'A03',
    item: [
      ['lauk-06', 1],
      ['sayur-06', 1],
    ],
    status: 'selesai',
    pembayaran: 'dibayar',
    dibuatPada: waktu(0, 8, 20),
    dibayarPada: waktu(0, 8, 45),
  }),
  buatPesanan({
    id: 'BE-0004',
    nama: 'Rina',
    nomorMeja: 'A01',
    item: [
      ['lauk-07', 1],
      ['sayur-04', 1],
    ],
    status: 'selesai',
    pembayaran: 'dibayar',
    dibuatPada: waktu(1, 12, 30),
    dibayarPada: waktu(1, 13, 0),
  }),
  buatPesanan({
    id: 'BE-0005',
    nama: 'Andi',
    nomorMeja: 'A02',
    item: [['lauk-10', 1]],
    status: 'batal',
    pembayaran: 'belum',
    dibuatPada: waktu(1, 11, 10),
  }),
  buatPesanan({
    id: 'BE-0006',
    nama: 'Dewi',
    nomorMeja: 'A03',
    item: [
      ['lauk-05', 1],
      ['sayur-01', 1],
      ['sayur-07', 1],
    ],
    status: 'selesai',
    pembayaran: 'dibayar',
    dibuatPada: waktu(3, 13, 0),
    dibayarPada: waktu(3, 13, 20),
  }),
  buatPesanan({
    id: 'BE-0007',
    nama: 'Fajar',
    nomorMeja: 'A01',
    item: [
      ['lauk-03', 1],
      ['sayur-05', 1],
    ],
    status: 'selesai',
    pembayaran: 'dibayar',
    dibuatPada: waktu(4, 12, 0),
    dibayarPada: waktu(4, 12, 30),
  }),
]
