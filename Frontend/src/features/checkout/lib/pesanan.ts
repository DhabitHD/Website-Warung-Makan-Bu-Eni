import type { OrderResult, StatusPembayaran, StatusPesanan } from '../types'

/** Varian badge yang tersedia di `components/ui/badge.tsx`. */
export type VarianBadge = 'brand' | 'accent' | 'muted' | 'outline'

const LABEL_STATUS: Record<StatusPesanan, string> = {
  masuk: 'Pesanan masuk',
  diproses: 'Diproses',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
}

const VARIAN_STATUS: Record<StatusPesanan, VarianBadge> = {
  masuk: 'accent',
  diproses: 'outline',
  selesai: 'brand',
  batal: 'muted',
}

const LABEL_PEMBAYARAN: Record<StatusPembayaran, string> = {
  belum: 'Belum dibayar',
  dibayar: 'Sudah dibayar',
}

const VARIAN_PEMBAYARAN: Record<StatusPembayaran, VarianBadge> = {
  belum: 'muted',
  dibayar: 'brand',
}

export function labelStatusPesanan(status: StatusPesanan): string {
  return LABEL_STATUS[status]
}

export function varianStatusPesanan(status: StatusPesanan): VarianBadge {
  return VARIAN_STATUS[status]
}

export function labelPembayaran(status: StatusPembayaran): string {
  return LABEL_PEMBAYARAN[status]
}

export function varianPembayaran(status: StatusPembayaran): VarianBadge {
  return VARIAN_PEMBAYARAN[status]
}

/** Aturan transisi status sesuai kontrak API bagian 2.2. */
export function transisiStatusDiizinkan(dari: StatusPesanan, ke: StatusPesanan): boolean {
  if (dari === ke) return true
  if (dari === 'masuk') return ke === 'diproses' || ke === 'batal'
  if (dari === 'diproses') return ke === 'selesai' || ke === 'batal'
  return false
}

/** Pesanan aktif hanya bisa dibatalkan bila belum dibayar. */
export function bisaBatalkan(pesanan: OrderResult): boolean {
  return (
    (pesanan.status === 'masuk' || pesanan.status === 'diproses') &&
    pesanan.pembayaran !== 'dibayar'
  )
}

/** Pesanan batal tidak boleh ditandai dibayar. */
export function bisaTandaiDibayar(pesanan: OrderResult): boolean {
  return pesanan.status !== 'batal'
}

/** Format tanggal + jam untuk daftar dan detail pesanan. */
export function formatWaktu(iso: string): string {
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(waktu)
}

/** Format tanggal saja, dipakai pada ringkasan dan riwayat. */
export function formatTanggal(iso: string): string {
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(waktu)
}

/** Tanggal lokal dalam format `YYYY-MM-DD` untuk perbandingan filter. */
export function tanggalLokal(iso: string): string {
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return ''

  const tahun = waktu.getFullYear()
  const bulan = String(waktu.getMonth() + 1).padStart(2, '0')
  const hari = String(waktu.getDate()).padStart(2, '0')
  return `${tahun}-${bulan}-${hari}`
}

/**
 * Tanggal hari ini dihitung sekali saat modul dimuat, bukan saat render,
 * supaya tidak memicu aturan purity React dan cukup untuk demo satu sesi.
 */
const SEKARANG = new Date()
export const TANGGAL_HARI_INI = tanggalLokal(SEKARANG.toISOString())
