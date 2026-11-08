import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatRupiah } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types/cart'

interface OrderSummaryCardProps {
  items: CartItem[]
  className?: string
}

/** Kartu ringkasan "Pesananmu" — dipakai di halaman menu. */
export function OrderSummaryCard({ items, className }: OrderSummaryCardProps) {
  const totalJumlah = items.reduce((total, item) => total + item.jumlah, 0)
  const totalHarga = items.reduce((total, item) => total + item.harga * item.jumlah, 0)
  const kosong = items.length === 0

  return (
    <aside
      className={cn(
        'rounded-xl border border-border bg-surface p-5 shadow-card',
        className,
      )}
      aria-label="Ringkasan pesanan"
    >
      <header className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-medium text-ink">Pesananmu</h2>
        {!kosong && (
          <span
            className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-surface"
            aria-label={`${totalJumlah} item dipilih`}
          >
            {totalJumlah}
          </span>
        )}
      </header>

      <div className="mt-4 border-t border-border pt-4">
        {kosong ? (
          <p className="py-6 text-center text-sm text-muted">
            Belum ada pilihan. Tambah lauk atau sayur dulu, ya.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {items.map((item) => (
              <li key={item.itemId} className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.nama}</p>
                  <p className="mt-1 text-xs text-muted">
                    {item.jumlah} × Rp{formatRupiah(item.harga)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-ink">
                  Rp{formatRupiah(item.harga * item.jumlah)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
        <span className="text-sm text-muted">Total sementara</span>
        <span className="font-display text-3xl font-medium text-ink">
          Rp{formatRupiah(totalHarga)}
        </span>
      </div>

      <Link to="/cart" className="btn-accent mt-4 w-full">
        Lihat keranjang
        <ArrowRight className="size-4" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-center text-xs text-muted">
        Jumlah dan total bisa kamu periksa lagi sebelum checkout.
      </p>
    </aside>
  )
}
