import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BadgePesanan } from '@/features/checkout/components/admin/BadgePesanan'
import { usePesanan } from '@/features/checkout/hooks/usePesanan'
import {
  bisaBatalkan,
  formatWaktu,
  labelPembayaran,
  labelStatusPesanan,
} from '@/features/checkout/lib/pesanan'
import {
  ubahPembayaranPesanan,
  ubahStatusPesanan,
} from '@/features/checkout/services/order.service'
import type { StatusPembayaran, StatusPesanan } from '@/features/checkout/types'
import { formatRupiah, formatRupiahFull } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface PesanAksi {
  jenis: 'sukses' | 'galat'
  teks: string
}

/** Detail satu pesanan + aksi ubah status dan pembayaran (milik Arya). */
export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pesanan = usePesanan(id)
  const [pesan, setPesan] = useState<PesanAksi | null>(null)
  const [konfirmasiBatal, setKonfirmasiBatal] = useState(false)

  const mutasiStatus = useMutation({
    mutationFn: (status: StatusPesanan) => {
      if (!pesanan) throw new Error('Pesanan tidak ditemukan.')
      return ubahStatusPesanan(pesanan.id, status)
    },
    onSuccess: (hasil) => {
      setPesan({
        jenis: 'sukses',
        teks: `Status pesanan diubah menjadi ${labelStatusPesanan(hasil.status).toLowerCase()}.`,
      })
      setKonfirmasiBatal(false)
    },
    onError: (error) => {
      setPesan({
        jenis: 'galat',
        teks: error instanceof Error ? error.message : 'Gagal mengubah status pesanan.',
      })
    },
  })

  const mutasiPembayaran = useMutation({
    mutationFn: (pembayaran: StatusPembayaran) => {
      if (!pesanan) throw new Error('Pesanan tidak ditemukan.')
      return ubahPembayaranPesanan(pesanan.id, pembayaran)
    },
    onSuccess: (hasil) => {
      setPesan({
        jenis: 'sukses',
        teks: `Pembayaran ditandai ${labelPembayaran(hasil.pembayaran).toLowerCase()}.`,
      })
    },
    onError: (error) => {
      setPesan({
        jenis: 'galat',
        teks: error instanceof Error ? error.message : 'Gagal mengubah pembayaran.',
      })
    },
  })

  if (!pesanan) {
    return (
      <div>
        <EmptyState
          judul="Pesanan tidak ditemukan"
          deskripsi="Pesanan dengan nomor ini mungkin sudah dihapus atau tautannya salah."
        />
        <div className="mt-6 flex justify-center">
          <Link to="/admin/pesanan" className="btn-outline w-auto px-4">
            Kembali ke daftar pesanan
          </Link>
        </div>
      </div>
    )
  }

  const aktif = pesanan.status === 'masuk' || pesanan.status === 'diproses'
  const bisaBatal = bisaBatalkan(pesanan)
  const bisaDibayar = pesanan.status !== 'batal' && pesanan.pembayaran === 'belum'
  const sibuk = mutasiStatus.isPending || mutasiPembayaran.isPending

  return (
    <div>
      <Link
        to="/admin/pesanan"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Daftar pesanan
      </Link>

      <div className="mt-4 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
            Detail pesanan
          </p>
          <h1 className="mt-2 font-display text-3xl font-medium text-ink">{pesanan.id}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dibuat {formatWaktu(pesanan.dibuatPada)}
          </p>
        </div>
        <BadgePesanan status={pesanan.status} pembayaran={pesanan.pembayaran} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex flex-col gap-6">
          <section
            aria-labelledby="rincian-pesanan"
            className="rounded-xl border border-border bg-surface shadow-card"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 id="rincian-pesanan" className="font-display text-2xl font-medium text-ink">
                Rincian pesanan
              </h2>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Harga</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pesanan.items.map((item) => (
                  <TableRow key={item.menuId}>
                    <TableCell className="font-medium text-ink">{item.nama}</TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      Rp{formatRupiah(item.harga)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {item.jumlah}
                    </TableCell>
                    <TableCell className="text-right font-medium whitespace-nowrap text-ink">
                      Rp{formatRupiah(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-end justify-between gap-3 border-t border-border px-5 py-4">
              <span className="text-sm text-muted-foreground">Total pesanan</span>
              <span className="font-display text-3xl font-medium text-ink">
                {formatRupiahFull(pesanan.totalHarga)}
              </span>
            </div>
          </section>

          <section
            aria-labelledby="data-pemesan"
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
          >
            <h2 id="data-pemesan" className="font-display text-2xl font-medium text-ink">
              Data pemesan
            </h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nama pemesan</dt>
                <dd className="mt-1 font-medium text-ink">{pesanan.nama}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Nomor meja</dt>
                <dd className="mt-1 font-medium text-ink">
                  {pesanan.nomorMeja ? `Meja ${pesanan.nomorMeja}` : 'Tanpa meja'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Dibuat pada</dt>
                <dd className="mt-1 text-ink">{formatWaktu(pesanan.dibuatPada)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Dibayar pada</dt>
                <dd className="mt-1 text-ink">
                  {pesanan.dibayarPada ? formatWaktu(pesanan.dibayarPada) : 'Belum dibayar'}
                </dd>
              </div>
              {pesanan.catatan && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Catatan pelanggan</dt>
                  <dd className="mt-1 text-ink">{pesanan.catatan}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <section
            aria-labelledby="tindakan-pesanan"
            className="rounded-xl border border-border bg-surface p-5 shadow-card"
          >
            <h2 id="tindakan-pesanan" className="font-display text-2xl font-medium text-ink">
              Tindakan
            </h2>

            {pesan && (
              <div
                role="status"
                className={cn(
                  'mt-4 rounded-lg border px-4 py-3 text-sm',
                  pesan.jenis === 'sukses'
                    ? 'border-brand/30 bg-brand/5 text-brand'
                    : 'border-destructive/30 bg-destructive/5 text-destructive',
                )}
              >
                {pesan.teks}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2">
              {pesanan.status === 'masuk' && (
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => mutasiStatus.mutate('diproses')}
                  disabled={sibuk}
                >
                  {mutasiStatus.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  Proses pesanan
                </Button>
              )}

              {pesanan.status === 'diproses' && (
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => mutasiStatus.mutate('selesai')}
                  disabled={sibuk}
                >
                  {mutasiStatus.isPending && (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  )}
                  Selesaikan pesanan
                </Button>
              )}

              {aktif && bisaBatal && !konfirmasiBatal && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setKonfirmasiBatal(true)}
                  disabled={sibuk}
                >
                  Batalkan pesanan
                </Button>
              )}

              {aktif && !bisaBatal && (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  Pesanan sudah dibayar. Tandai pembayaran ke belum dulu sebelum membatalkan.
                </p>
              )}

              {!aktif && (
                <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                  {pesanan.status === 'selesai'
                    ? 'Pesanan sudah selesai dan tidak bisa diubah lagi.'
                    : 'Pesanan sudah dibatalkan dan tidak bisa diubah lagi.'}
                </p>
              )}
            </div>

            {konfirmasiBatal && (
              <div
                role="alertdialog"
                aria-labelledby="konfirmasi-batal"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <p id="konfirmasi-batal" className="text-sm font-semibold text-ink">
                  Batalkan pesanan ini?
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Status batal tidak bisa dikembalikan. Pastikan pesanan memang tidak dilanjutkan.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => mutasiStatus.mutate('batal')}
                    disabled={sibuk}
                  >
                    Ya, batalkan
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setKonfirmasiBatal(false)}
                    disabled={sibuk}
                  >
                    Tidak
                  </Button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-ink">Pembayaran</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Hanya pesanan berstatus dibayar yang dihitung sebagai pemasukan.
              </p>

              <div className="mt-3 flex flex-col gap-2">
                {bisaDibayar && (
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => mutasiPembayaran.mutate('dibayar')}
                    disabled={sibuk}
                  >
                    {mutasiPembayaran.isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    <CreditCard className="size-4" aria-hidden="true" />
                    Tandai sudah dibayar
                  </Button>
                )}

                {pesanan.pembayaran === 'dibayar' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => mutasiPembayaran.mutate('belum')}
                    disabled={sibuk}
                  >
                    {mutasiPembayaran.isPending && (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    )}
                    Tandai belum dibayar
                  </Button>
                )}

                {pesanan.status === 'batal' && (
                  <p className="rounded-lg bg-secondary px-3 py-2 text-xs text-muted-foreground">
                    Pesanan yang dibatalkan tidak bisa ditandai dibayar.
                  </p>
                )}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
