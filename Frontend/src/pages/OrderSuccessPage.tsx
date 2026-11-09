import { ArrowRight, CheckCircle2, ReceiptText } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/shared/EmptyState'
import { bacaPesananTerakhir } from '@/features/checkout/services/order.service'
import type { OrderResult } from '@/features/checkout/types'
import { formatRupiah } from '@/lib/currency'

interface OrderSuccessState {
  pesanan?: OrderResult
}

function formatWaktu(iso: string): string {
  const waktu = new Date(iso)
  if (Number.isNaN(waktu.getTime())) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(waktu)
}

export function OrderSuccessPage() {
  const location = useLocation()
  const state = location.state as OrderSuccessState | null
  const pesanan = state?.pesanan ?? bacaPesananTerakhir()

  if (!pesanan) {
    return (
      <PageShell>
        <Container className="py-16 pb-24">
          <div className="mx-auto max-w-xl">
            <EmptyState
              ikon={<ReceiptText className="size-7 text-muted-foreground" aria-hidden="true" />}
              judul="Belum ada pesanan"
              deskripsi="Selesaikan checkout dulu untuk melihat konfirmasi pesanan di halaman ini."
            />
            <div className="mt-6 flex justify-center">
              <Link to="/menu" className="btn-accent">
                Kembali ke menu
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Container>
      </PageShell>
    )
  }

  const menuUrl = pesanan.nomorMeja
    ? `/menu?table=${encodeURIComponent(pesanan.nomorMeja)}`
    : '/menu'

  return (
    <PageShell>
      <Container className="py-10 pb-24 lg:pb-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand/10 text-brand">
              <CheckCircle2 className="size-7" aria-hidden="true" />
            </span>
            <p className="mt-5 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Pesanan diterima
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium text-ink sm:text-5xl">
              Terima kasih, {pesanan.nama}!
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              Pesananmu sudah dikirim ke warung. Tunjukkan nomor pesanan ini saat membayar di
              kasir.
            </p>
          </div>

          <section
            aria-label="Detail pesanan"
            className="mt-8 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs text-muted-foreground">Nomor pesanan</p>
                <p className="mt-1 font-display text-2xl font-semibold text-brand">{pesanan.id}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
                <span className="size-1.5 rounded-full bg-brand" aria-hidden="true" />
                Menunggu konfirmasi warung
              </span>
            </div>

            <dl className="grid gap-4 border-b border-border py-5 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Nama pemesan</dt>
                <dd className="mt-1 font-medium text-ink">{pesanan.nama}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Nomor meja</dt>
                <dd className="mt-1 font-medium text-ink">Meja {pesanan.nomorMeja}</dd>
              </div>
              {pesanan.catatan && (
                <div className="sm:col-span-2">
                  <dt className="text-xs text-muted-foreground">Catatan</dt>
                  <dd className="mt-1 text-ink">{pesanan.catatan}</dd>
                </div>
              )}
            </dl>

            <ul className="divide-y divide-border">
              {pesanan.items.map((item) => (
                <li
                  key={item.itemId}
                  className="flex items-start justify-between gap-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{item.nama}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.jumlah} porsi</p>
                  </div>
                  <p className="font-medium text-ink">
                    Rp{formatRupiah(item.harga * item.jumlah)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-3xl font-medium text-ink">
                Rp{formatRupiah(pesanan.totalHarga)}
              </span>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Dibuat {formatWaktu(pesanan.dibuatPada)}. Simpan nomor pesanan ini sampai pembayaran
              selesai.
            </p>
          </section>

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link to={menuUrl} className="btn-accent w-full sm:w-auto">
              Pesan lagi
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <p className="text-center text-xs text-muted-foreground">
              Halaman ini boleh ditutup setelah pesanan dicatat.
            </p>
          </div>
        </div>
      </Container>
    </PageShell>
  )
}
