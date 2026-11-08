import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { formatRupiah } from '@/lib/currency'
import { hitungTotalHarga, hitungTotalJumlah, useCartStore } from '@/features/cart/store/cart-store'

/**
 * Bilah keranjang melayang — ringkasan "Pesananmu" untuk layar kecil (< lg).
 * Hanya tampil saat keranjang terisi agar halaman tetap bersih saat kosong;
 * di desktop ringkasan tetap memakai sidebar sticky (OrderSummaryCard).
 */
export function CartBar() {
  const items = useCartStore((state) => state.items)

  if (items.length === 0) {
    return null
  }

  const totalJumlah = hitungTotalJumlah(items)
  const totalHarga = hitungTotalHarga(items)

  return (
    <div
      aria-label="Ringkasan pesanan"
      className="fixed inset-x-0 bottom-0 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 lg:hidden"
    >
      <div className="border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] shadow-card backdrop-blur-sm">
        <Container className="flex items-center justify-between gap-3 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-label={`${totalJumlah} item dipilih`}
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-surface"
            >
              {totalJumlah}
            </span>
            <p className="min-w-0 text-sm">
              <span className="block text-xs text-muted-foreground">Total sementara</span>
              <span className="block font-semibold text-ink">Rp{formatRupiah(totalHarga)}</span>
            </p>
          </div>
          <Link to="/cart" className="btn-accent shrink-0 px-4 py-2.5">
            Lihat keranjang
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Container>
      </div>
    </div>
  )
}
