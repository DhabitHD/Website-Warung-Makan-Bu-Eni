import type { ReactNode } from 'react'

interface EmptyStateProps {
  judul: string
  deskripsi?: string
  ikon?: ReactNode
}

/** Tampilan kosong, misalnya pencarian tidak ditemukan. */
export function EmptyState({ judul, deskripsi, ikon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/60 px-6 py-14 text-center">
      {ikon}
      <p className="mt-3 font-display text-xl text-ink">{judul}</p>
      {deskripsi && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{deskripsi}</p>}
    </div>
  )
}
