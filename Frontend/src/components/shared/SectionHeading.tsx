import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  /** Nomor urut tampilan, contoh: "01". */
  nomor: string
  /** Judul kategori, contoh: "Lauk". */
  judul: string
  /** Label kanan, contoh: "11 menu". */
  label?: string
  className?: string
}

/** Judul section kategori: "01 / Lauk" dengan label hitung di kanan. */
export function SectionHeading({ nomor, judul, label, className }: SectionHeadingProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <h2 className="flex items-baseline gap-2">
        <span className="font-display text-sm font-semibold text-accent">{nomor} /</span>
        <span className="font-display text-3xl font-medium text-ink sm:text-4xl">{judul}</span>
      </h2>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  )
}
