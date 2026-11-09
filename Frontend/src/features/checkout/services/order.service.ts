import type { OrderPayload, OrderResult } from '../types'

const LAST_ORDER_KEY = 'warung.pesananTerakhir'
const JEDA_KIRIM_MS = 900

function buatIdPesanan(): string {
  const tanggal = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const acak = Math.floor(1000 + Math.random() * 9000)
  return `BE-${tanggal}-${acak}`
}

/**
 * Simulasi POST /orders.
 * Ganti isi fungsi ini dengan pemanggilan API sungguhan pada Tahap 4
 * tanpa mengubah pemanggilnya (CheckoutForm).
 */
export async function kirimPesanan(payload: OrderPayload): Promise<OrderResult> {
  await new Promise((resolve) => setTimeout(resolve, JEDA_KIRIM_MS))

  if (payload.items.length === 0) {
    throw new Error('Keranjang masih kosong. Tambahkan menu dulu, ya.')
  }

  const pesanan: OrderResult = {
    ...payload,
    items: payload.items.map((item) => ({ ...item })),
    id: buatIdPesanan(),
    dibuatPada: new Date().toISOString(),
    status: 'diterima',
  }

  simpanPesananTerakhir(pesanan)
  return pesanan
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
    return mentah ? (JSON.parse(mentah) as OrderResult) : null
  } catch {
    return null
  }
}
