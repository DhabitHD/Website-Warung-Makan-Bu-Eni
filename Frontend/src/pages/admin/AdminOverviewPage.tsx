import { ClipboardList, Clock, TrendingUp, Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { KartuStatistik } from '@/features/checkout/components/admin/KartuStatistik'
import { TabelPesanan } from '@/features/checkout/components/admin/TabelPesanan'
import { useDaftarPesanan } from '@/features/checkout/hooks/usePesanan'
import { TANGGAL_HARI_INI, tanggalLokal } from '@/features/checkout/lib/pesanan'
import { formatRupiahFull } from '@/lib/currency'

/** Halaman awal /admin — ringkasan pesanan dan transaksi hari ini. */
export function AdminOverviewPage() {
  const pesanan = useDaftarPesanan()

  const ringkasan = useMemo(() => {
    const hariIni = pesanan.filter(
      (item) => item.status !== 'batal' && tanggalLokal(item.dibuatPada) === TANGGAL_HARI_INI,
    )
    const aktif = pesanan.filter(
      (item) => item.status === 'masuk' || item.status === 'diproses',
    )
    const belumDibayar = pesanan.filter(
      (item) => item.status !== 'batal' && item.pembayaran === 'belum',
    )
    const pemasukanHariIni = pesanan
      .filter(
        (item) =>
          item.pembayaran === 'dibayar' &&
          item.dibayarPada !== null &&
          tanggalLokal(item.dibayarPada) === TANGGAL_HARI_INI,
      )
      .reduce((total, item) => total + item.totalHarga, 0)

    return {
      jumlahHariIni: hariIni.length,
      aktif: aktif.length,
      belumDibayar: belumDibayar.length,
      pemasukanHariIni,
    }
  }, [pesanan])

  const terbaru = useMemo(() => pesanan.slice(0, 5), [pesanan])

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Dashboard Pesanan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan pesanan masuk dan transaksi hari ini.
          </p>
        </div>
        <Link to="/admin/pesanan" className="btn-outline w-auto px-4">
          Lihat semua pesanan
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KartuStatistik
          label="Pesanan hari ini"
          nilai={ringkasan.jumlahHariIni}
          keterangan="Tidak termasuk pesanan dibatalkan"
          ikon={<ClipboardList className="size-5" aria-hidden="true" />}
        />
        <KartuStatistik
          label="Pesanan aktif"
          nilai={ringkasan.aktif}
          keterangan="Masuk atau sedang diproses"
          ikon={<Clock className="size-5" aria-hidden="true" />}
        />
        <KartuStatistik
          label="Belum dibayar"
          nilai={ringkasan.belumDibayar}
          keterangan="Perlu ditandai saat pelanggan membayar"
          ikon={<Wallet className="size-5" aria-hidden="true" />}
        />
        <KartuStatistik
          label="Pemasukan hari ini"
          nilai={formatRupiahFull(ringkasan.pemasukanHariIni)}
          keterangan="Hanya pesanan berstatus dibayar"
          ikon={<TrendingUp className="size-5" aria-hidden="true" />}
        />
      </div>

      <section aria-labelledby="pesanan-terbaru" className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="pesanan-terbaru" className="font-display text-2xl font-medium text-ink">
              Pesanan terbaru
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Lima pesanan terakhir yang masuk, termasuk yang sudah selesai.
            </p>
          </div>
          <Link to="/admin/pesanan" className="text-sm font-medium text-brand hover:underline">
            Semua pesanan
          </Link>
        </div>
        <TabelPesanan pesanan={terbaru} />
      </section>
    </div>
  )
}
