import { ImageOff, Plus } from 'lucide-react'
import { formatRupiah } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { MenuItem } from '@/types/menu'

interface MenuItemCardProps {
  menu: MenuItem
  onTambah: (menu: MenuItem) => void
  className?: string
}

/** Card makanan: foto, nama, harga, dan tombol "+ Tambah". */
export function MenuItemCard({ menu, onTambah, className }: MenuItemCardProps) {
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-card',
        className,
      )}
    >
      {/* Area foto — placeholder bila gambar belum tersedia */}
      <div className="relative flex aspect-[4/3] items-center justify-center bg-placeholder">
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 size-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/40"
        />
        <div className="relative flex flex-col items-center gap-1.5 text-muted">
          <ImageOff className="size-6" aria-hidden="true" />
          <span className="text-xs font-medium">Foto menu</span>
          <span className="text-[0.7rem]">{menu.foto}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <h3 className="text-base font-semibold text-ink">{menu.nama}</h3>
          <p className="mt-1 text-sm text-muted">
            <span className="text-ink/70">Rp</span>
            {formatRupiah(menu.harga)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onTambah(menu)}
          className="btn-outline mt-auto"
          aria-label={`Tambah ${menu.nama} ke pesanan`}
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah
        </button>
      </div>
    </article>
  )
}
