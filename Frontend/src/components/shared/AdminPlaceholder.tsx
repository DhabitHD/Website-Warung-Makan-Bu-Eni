import { Construction } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'

interface AdminPlaceholderProps {
  /** Judul halaman, contoh: "Pesanan Masuk". */
  judul: string
  /** Kalimat penjelas singkat. */
  keterangan: string
}

/**
 * Penanda halaman admin yang menunggu pengerjaan Arya (Fase 2).
 * Pola sama dengan placeholder Tahap 3 agar konsisten.
 */
export function AdminPlaceholder({ judul, keterangan }: AdminPlaceholderProps) {
  return (
    <div>
      <h1 className="font-display text-3xl font-medium text-ink">{judul}</h1>

      <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-8 text-center shadow-card sm:p-12">
        <Construction className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-ink">{keterangan}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Halaman ini dikerjakan Arya pada Fase 2 — struktur rute & layout sudah siap.
        </p>
        <Badge variant="accent" className="mt-4">
          Menunggu pengerjaan
        </Badge>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/admin/menu" className="btn-outline w-auto px-4">
            Kelola menu
          </Link>
          <Link to="/menu" className="btn-outline w-auto px-4">
            Lihat halaman pelanggan
          </Link>
        </div>
      </div>
    </div>
  )
}
