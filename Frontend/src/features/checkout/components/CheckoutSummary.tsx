import { formatRupiah } from '@/lib/currency'
import { hitungTotalHarga, hitungTotalJumlah } from '@/features/cart/store/cart-store'
import type { CartItem } from '@/types/cart'

interface CheckoutSummaryProps {
  items: CartItem[]
  nomorMeja: string
}

/** Ringkasan pesanan di samping form checkout. */
export function CheckoutSummary({ items, nomorMeja }: CheckoutSummaryProps) {
  const totalJumlah = hitungTotalJumlah(items)
  const totalHarga = hitungTotalHarga(items)

  return (
    <aside
      aria-label="Ringkasan pesanan checkout"
      className="rounded-xl border border-border bg-surface p-5 shadow-card"
    >
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-ink">Pesananmu</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {nomorMeja ? (
              <>
                Meja <span className="font-semibold text-brand">{nomorMeja}</span>
              </>
            ) : (
              'Nomor meja belum diisi'
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

      <ul className="mt-5 flex flex-col gap-3 border-y border-border py-4">
        {items.map((item) => (
          <li key={item.itemId} className="flex items-start justify-between gap-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-ink">{item.nama}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.jumlah} × Rp{formatRupiah(item.harga)}
              </p>
            </div>
            <p className="shrink-0 font-medium text-ink">
              Rp{formatRupiah(item.harga * item.jumlah)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-xs text-muted-foreground">{totalJumlah} porsi</p>
        </div>
        <p className="font-display text-3xl font-medium text-ink">
          Rp{formatRupiah(totalHarga)}
        </p>
      </div>
    </aside>
  )
}
