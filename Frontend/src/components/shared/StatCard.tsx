interface StatCardProps {
  totalMenu: number
  jumlahLauk: number
  jumlahSayur: number
}

/** Kartu statistik hijau tua di sebelah hero. */
export function StatCard({ totalMenu, jumlahLauk, jumlahSayur }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand px-6 py-6 text-surface sm:px-8 sm:py-7">
      {/* Lingkaran dekoratif samar */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full border border-surface/15"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-20 size-48 rounded-full border border-surface/10"
      />

      <p className="text-[0.7rem] font-semibold tracking-[0.18em] text-surface/70 uppercase">
        Pilihan menu
      </p>
      <p className="mt-3 flex items-baseline gap-3">
        <span className="font-display text-5xl leading-none font-medium">{totalMenu}</span>
        <span className="text-sm text-surface/80">macam masakan</span>
      </p>
      <p className="mt-4 border-t border-surface/15 pt-3 text-sm text-surface/70">
        {jumlahLauk} lauk · {jumlahSayur} sayur
      </p>
    </div>
  )
}
