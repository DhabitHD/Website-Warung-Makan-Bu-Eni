import { AdminPlaceholder } from '@/components/shared/AdminPlaceholder'

/** Halaman awal /admin — dashboard pesanan (milik Arya). */
export function AdminOverviewPage() {
  return (
    <AdminPlaceholder
      judul="Dashboard Pesanan"
      keterangan="Ringkasan pesanan masuk, status, dan transaksi hari ini akan tampil di sini."
    />
  )
}
