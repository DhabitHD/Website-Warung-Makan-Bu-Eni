import type { ReactNode } from 'react'

interface KartuStatistikProps {
  label: string
  nilai: string | number
  keterangan?: string
  ikon?: ReactNode
}

/** Kartu ringkasan angka di dashboard dan riwayat admin. */
export function KartuStatistik({ label, nilai, keterangan, ikon }: KartuStatistikProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
        {ikon && <span className="shrink-0 text-brand">{ikon}</span>}
      </div>
      <p className="mt-2 font-display text-3xl leading-none font-medium text-ink">{nilai}</p>
      {keterangan && <p className="mt-2 text-xs text-muted-foreground">{keterangan}</p>}
    </div>
  )
}
