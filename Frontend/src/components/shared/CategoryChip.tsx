import type { FilterKategori } from '@/types/menu'
import { cn } from '@/lib/utils'

interface CategoryChipProps {
  kategori: FilterKategori
  aktif: boolean
  onSelect: (kategori: FilterKategori) => void
}

const LABEL: Record<FilterKategori, string> = {
  semua: 'Semua',
  lauk: 'Lauk',
  sayur: 'Sayur',
}

/** Chip filter kategori: Semua | Lauk | Sayur. */
export function CategoryChip({ kategori, aktif, onSelect }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(kategori)}
      aria-pressed={aktif}
      className={cn(
        'h-10 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        aktif ? 'bg-brand text-surface' : 'text-ink hover:bg-secondary',
      )}
    >
      {LABEL[kategori]}
    </button>
  )
}
