import { Minus, Plus, Trash2 } from 'lucide-react'
import { formatRupiah } from '@/lib/currency'
import type { CartItem } from '@/types/cart'

interface CartItemRowProps {
  item: CartItem
  onUbahJumlah: (itemId: string, jumlah: number) => void
  onHapus: (itemId: string) => void
}

/** Satu baris pesanan di halaman keranjang: jumlah, subtotal, dan hapus. */
export function CartItemRow({ item, onUbahJumlah, onHapus }: CartItemRowProps) {
  const subtotal = item.harga * item.jumlah

  return (
    <li className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{item.nama}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Rp{formatRupiah(item.harga)} / porsi
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-5">
        <div
          role="group"
          aria-label={`Jumlah ${item.nama}`}
          className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1"
        >
          <button
            type="button"
            onClick={() => onUbahJumlah(item.itemId, item.jumlah - 1)}
            disabled={item.jumlah <= 1}
            aria-label={`Kurangi jumlah ${item.nama}`}
            className="flex size-8 items-center justify-center rounded-md text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none disabled:opacity-40"
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span
            aria-live="polite"
            className="w-8 text-center text-sm font-semibold text-ink"
          >
            {item.jumlah}
          </span>
          <button
            type="button"
            onClick={() => onUbahJumlah(item.itemId, item.jumlah + 1)}
            aria-label={`Tambah jumlah ${item.nama}`}
            className="flex size-8 items-center justify-center rounded-md text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>

        <p className="w-20 text-right text-sm font-semibold text-ink sm:w-24">
          Rp{formatRupiah(subtotal)}
        </p>

        <button
          type="button"
          onClick={() => onHapus(item.itemId)}
          aria-label={`Hapus ${item.nama} dari keranjang`}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}
