import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRupiah } from '@/lib/currency'
import { hitungTotalHarga, hitungTotalJumlah } from '@/features/cart/store/cart-store'
import type { CartItem } from '@/types/cart'

interface CartSummaryProps {
  items: CartItem[]
  checkoutUrl: string
  nomorMeja?: string
}

/** Panel ringkasan keranjang + tombol menuju checkout. */
export function CartSummary({ items, checkoutUrl, nomorMeja }: CartSummaryProps) {
  const totalJumlah = hitungTotalJumlah(items)
  const totalHarga = hitungTotalHarga(items)

  return (
    <aside
      aria-label="Ringkasan keranjang"
      className="rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">Ringkasan</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {nomorMeja ? (
              <>
                Meja <span className="font-semibold text-brand">{nomorMeja}</span>
              </>
            ) : (
              'Nomor meja diisi saat checkout'
            )}
          </p>
        </div>
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-surface"
          aria-label={`${totalJumlah} item dipilih`}
        >
          {totalJumlah}
        </span>
      </header>

      <dl className="mt-5 flex flex-col gap-2 border-t border-border pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Jumlah item</dt>
          <dd className="font-medium text-ink">{totalJumlah} porsi</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted-foreground">Pembayaran</dt>
          <dd className="font-medium text-ink">Di kasir</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="font-display text-3xl font-medium text-ink">
          Rp{formatRupiah(totalHarga)}
        </span>
      </div>

      <Link to={checkoutUrl} className="btn-accent mt-4 w-full">
        Lanjut ke checkout
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pembayaran dilakukan di kasir setelah pesanan dikonfirmasi.
      </p>
    </aside>
  )
}
