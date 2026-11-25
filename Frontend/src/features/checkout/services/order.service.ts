import { useMenuStore } from '@/features/menu/store/menu-store'
import { transisiStatusDiizinkan } from '../lib/pesanan'
import { orderPayloadSchema } from '../schemas/order'
import { useOrderStore } from '../store/order-store'
import type {
  ItemPesanan,
  OrderPayload,
  OrderResult,
  StatusPembayaran,
  StatusPesanan,
} from '../types'

const LAST_ORDER_KEY = 'warung.pesananTerakhir'
const JEDA_KIRIM_MS = 900
const JEDA_UBAH_MS = 250
const STATUS_VALID: StatusPesanan[] = ['masuk', 'diproses', 'selesai', 'batal']

function tunggu(jeda: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, jeda))
}

function nomorBerikutnya(pesanan: OrderResult[]): string {
  const nomorTerbesar = pesanan.reduce((maks, item) => {
    const cocok = /^BE-(\d+)$/.exec(item.id)
    return cocok ? Math.max(maks, Number(cocok[1])) : maks
  }, 0)

  return `BE-${String(nomorTerbesar + 1).padStart(4, '0')}`
}

function cariPesanan(id: string): OrderResult {
  const pesanan = useOrderStore.getState().pesanan.find((item) => item.id === id)
  if (!pesanan) {
    throw new Error('Pesanan tidak ditemukan.')
  }
  return pesanan
}

/**
 * Simulasi POST /pesanan.
 * Harga dan total dihitung dari katalog (bukan dari keranjang), mengikuti aturan server.
 * Ganti isi fungsi ini dengan pemanggilan API sungguhan pada Tahap 4 tanpa mengubah
 * pemanggilnya (CheckoutForm).
 */
export async function kirimPesanan(payload: OrderPayload): Promise<OrderResult> {
  // Validasi klien memakai Zod yang sama dengan aturan kontrak API.
  orderPayloadSchema.parse(payload)
  await tunggu(JEDA_KIRIM_MS)

  const daftar = useOrderStore.getState().pesanan
  const sudahAda = daftar.find((item) => item.idPermintaan === payload.idPermintaan)
  if (sudahAda) {
    simpanPesananTerakhir(sudahAda)
    return sudahAda
  }

  const menu = useMenuStore.getState().items
  const items: ItemPesanan[] = payload.items.map((item, indeks) => {
    const ditemukan = menu.find((katalog) => katalog.id === item.menuId)
    if (!ditemukan) {
      throw new Error(`Menu pada baris ${indeks + 1} tidak ditemukan.`)
    }
    if (ditemukan.tersedia === false) {
      throw new Error(`${ditemukan.nama} sedang habis. Silakan pilih menu lain.`)
    }

    return {
      menuId: ditemukan.id,
      nama: ditemukan.nama,
      harga: ditemukan.harga,
      jumlah: item.jumlah,
      subtotal: ditemukan.harga * item.jumlah,
    }
  })

  const totalHarga = items.reduce((total, item) => total + item.subtotal, 0)
  const pesanan: OrderResult = {
    id: nomorBerikutnya(daftar),
    idPermintaan: payload.idPermintaan,
    nama: payload.nama,
    nomorMeja: payload.nomorMeja,
    catatan: payload.catatan,
    items,
    totalHarga,
    status: 'masuk',
    pembayaran: 'belum',
    dibuatPada: new Date().toISOString(),
    dibayarPada: null,
  }

  useOrderStore.getState().tambah(pesanan)
  simpanPesananTerakhir(pesanan)
  return pesanan
}

/** Simulasi PATCH /pesanan/:id/status dengan aturan transisi kontrak API. */
export async function ubahStatusPesanan(
  id: string,
  status: StatusPesanan,
): Promise<OrderResult> {
  await tunggu(JEDA_UBAH_MS)
  const pesanan = cariPesanan(id)

  if (pesanan.status === status) {
    return pesanan
  }

  if (status === 'batal' && pesanan.pembayaran === 'dibayar') {
    throw new Error(
      "Pesanan sudah dibayar. Ubah pembayaran ke 'belum' dulu, lalu batalkan.",
    )
  }

  if (!transisiStatusDiizinkan(pesanan.status, status)) {
    throw new Error('Status pesanan tidak dapat diubah ke status tersebut.')
  }

  useOrderStore.getState().perbarui(id, { status })
  return { ...pesanan, status }
}

/** Simulasi PATCH /pesanan/:id/pembayaran. */
export async function ubahPembayaranPesanan(
  id: string,
  pembayaran: StatusPembayaran,
): Promise<OrderResult> {
  await tunggu(JEDA_UBAH_MS)
  const pesanan = cariPesanan(id)

  if (pesanan.pembayaran === pembayaran) {
    return pesanan
  }

  if (pembayaran === 'dibayar' && pesanan.status === 'batal') {
    throw new Error('Pesanan yang dibatalkan tidak bisa ditandai dibayar.')
  }

  const dibayarPada = pembayaran === 'dibayar' ? new Date().toISOString() : null
  useOrderStore.getState().perbarui(id, { pembayaran, dibayarPada })

  return { ...pesanan, pembayaran, dibayarPada }
}

/** Simpan pesanan terakhir agar halaman konfirmasi tetap terbaca setelah refresh. */
export function simpanPesananTerakhir(pesanan: OrderResult): void {
  try {
    sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(pesanan))
  } catch {
    // Abaikan bila penyimpanan browser tidak tersedia.
  }
}

export function bacaPesananTerakhir(): OrderResult | null {
  try {
    const mentah = sessionStorage.getItem(LAST_ORDER_KEY)
    if (!mentah) return null

    const data = JSON.parse(mentah) as Partial<OrderResult> | null
    if (!data || typeof data.id !== 'string' || !Array.isArray(data.items)) return null

    const statusValid = STATUS_VALID.includes(data.status as StatusPesanan)
    const pembayaranValid = data.pembayaran === 'belum' || data.pembayaran === 'dibayar'
    if (!statusValid || !pembayaranValid) return null

    return data as OrderResult
  } catch {
    return null
  }
}
