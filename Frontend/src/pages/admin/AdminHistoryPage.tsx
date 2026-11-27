import { CheckCircle2, Wallet, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { FilterPesanan } from '@/features/checkout/components/admin/FilterPesanan'
import { KartuStatistik } from '@/features/checkout/components/admin/KartuStatistik'
import { TabelPesanan } from '@/features/checkout/components/admin/TabelPesanan'
import { useDaftarPesanan } from '@/features/checkout/hooks/usePesanan'
import { tanggalLokal } from '@/features/checkout/lib/pesanan'
import type { StatusPembayaran, StatusPesanan } from '@/features/checkout/types'
import { formatRupiahFull } from '@/lib/currency'

const OPSI_STATUS: StatusPesanan[] = ['selesai', 'batal']

const KELAS_TANGGAL =
  'h-11 rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none'

/** Riwayat pesanan selesai/dibatalkan dan ringkasan transaksi (milik Arya). */
export function AdminHistoryPage() {
  const pesanan = useDaftarPesanan()
  const [pencarian, setPencarian] = useState('')
  const [status, setStatus] = useState<StatusPesanan | 'semua'>('semua')
  const [pembayaran, setPembayaran] = useState<StatusPembayaran | 'semua'>('semua')
  const [dari, setDari] = useState('')
  const [sampai, setSampai] = useState('')

  const riwayat = useMemo(
    () => pesanan.filter((item) => item.status === 'selesai' || item.status === 'batal'),
    [pesanan],
  )

  const hasil = useMemo(() => {
    const kata = pencarian.trim().toLowerCase()

    return riwayat.filter((item) => {
      if (status !== 'semua' && item.status !== status) return false
      if (pembayaran !== 'semua' && item.pembayaran !== pembayaran) return false

      const tanggal = tanggalLokal(item.dibuatPada)
      if (dari !== '' && tanggal < dari) return false
      if (sampai !== '' && tanggal > sampai) return false
      if (kata === '') return true

      return (
        item.id.toLowerCase().includes(kata) ||
        item.nama.toLowerCase().includes(kata) ||
        item.nomorMeja.toLowerCase().includes(kata)
      )
    })
  }, [riwayat, pencarian, status, pembayaran, dari, sampai])

  const ringkasan = useMemo(() => {
    const selesai = hasil.filter((item) => item.status === 'selesai').length
    const batal = hasil.filter((item) => item.status === 'batal').length
    const pemasukan = hasil
      .filter((item) => item.pembayaran === 'dibayar')
      .reduce((total, item) => total + item.totalHarga, 0)

    return { selesai, batal, pemasukan }
  }, [hasil])

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-medium text-ink">Riwayat Pesanan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arsip pesanan selesai dan dibatalkan, beserta ringkasan transaksinya.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <KartuStatistik
          label="Pesanan selesai"
          nilai={ringkasan.selesai}
          keterangan="Sesuai filter yang aktif"
          ikon={<CheckCircle2 className="size-5" aria-hidden="true" />}
        />
        <KartuStatistik
          label="Pesanan dibatalkan"
          nilai={ringkasan.batal}
          keterangan="Tidak dihitung sebagai pemasukan"
          ikon={<XCircle className="size-5" aria-hidden="true" />}
        />
        <KartuStatistik
          label="Pemasukan"
          nilai={formatRupiahFull(ringkasan.pemasukan)}
          keterangan="Hanya pesanan berstatus dibayar"
          ikon={<Wallet className="size-5" aria-hidden="true" />}
        />
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

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="riwayat-dari" className="text-xs font-medium text-muted-foreground">
            Dari tanggal
          </label>
          <input
            id="riwayat-dari"
            type="date"
            value={dari}
            max={sampai || undefined}
            onChange={(event) => setDari(event.target.value)}
            className={KELAS_TANGGAL}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="riwayat-sampai" className="text-xs font-medium text-muted-foreground">
            Sampai tanggal
          </label>
          <input
            id="riwayat-sampai"
            type="date"
            value={sampai}
            min={dari || undefined}
            onChange={(event) => setSampai(event.target.value)}
            className={KELAS_TANGGAL}
          />
        </div>
        {(dari !== '' || sampai !== '') && (
          <button
            type="button"
            onClick={() => {
              setDari('')
              setSampai('')
            }}
            className="h-11 text-sm font-medium text-brand hover:underline"
          >
            Hapus filter tanggal
          </button>
        )}
      </div>

      <div className="mt-6">
        <TabelPesanan
          pesanan={hasil}
          judulKosong="Belum ada riwayat pesanan"
          deskripsiKosong="Pesanan yang sudah selesai atau dibatalkan akan muncul di sini."
        />
      </div>
    </div>
  )
}
