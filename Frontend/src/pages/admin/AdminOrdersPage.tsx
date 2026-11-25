import { useMemo, useState } from 'react'
import { FilterPesanan } from '@/features/checkout/components/admin/FilterPesanan'
import { TabelPesanan } from '@/features/checkout/components/admin/TabelPesanan'
import { useDaftarPesanan } from '@/features/checkout/hooks/usePesanan'
import type { StatusPembayaran, StatusPesanan } from '@/features/checkout/types'

const OPSI_STATUS: StatusPesanan[] = ['masuk', 'diproses']

/** Daftar pesanan aktif: masuk dan diproses (milik Arya). */
export function AdminOrdersPage() {
  const pesanan = useDaftarPesanan()
  const [pencarian, setPencarian] = useState('')
  const [status, setStatus] = useState<StatusPesanan | 'semua'>('semua')
  const [pembayaran, setPembayaran] = useState<StatusPembayaran | 'semua'>('semua')

  const aktif = useMemo(
    () => pesanan.filter((item) => item.status === 'masuk' || item.status === 'diproses'),
    [pesanan],
  )

  const hasil = useMemo(() => {
    const kata = pencarian.trim().toLowerCase()

    return aktif.filter((item) => {
      if (status !== 'semua' && item.status !== status) return false
      if (pembayaran !== 'semua' && item.pembayaran !== pembayaran) return false
      if (kata === '') return true

      return (
        item.id.toLowerCase().includes(kata) ||
        item.nama.toLowerCase().includes(kata) ||
        item.nomorMeja.toLowerCase().includes(kata)
      )
    })
  }, [aktif, pencarian, status, pembayaran])

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-ink">Pesanan Masuk</h1>
        <p className="text-sm text-muted-foreground">
          {aktif.length} pesanan aktif menunggu diproses atau diselesaikan.
        </p>
      </div>

      <div className="mt-6">
        <FilterPesanan
          pencarian={pencarian}
          onPencarian={setPencarian}
          status={status}
          onStatus={setStatus}
          pembayaran={pembayaran}
          onPembayaran={setPembayaran}
          opsiStatus={OPSI_STATUS}
        />
      </div>

      <div className="mt-6">
        <TabelPesanan
          pesanan={hasil}
          judulKosong="Tidak ada pesanan aktif"
          deskripsiKosong={
            aktif.length === 0
              ? 'Pesanan baru akan muncul di sini setelah pelanggan mengirim dari halaman checkout.'
              : 'Coba ubah kata pencarian atau filter status/pembayaran.'
          }
        />
      </div>
    </div>
  )
}
