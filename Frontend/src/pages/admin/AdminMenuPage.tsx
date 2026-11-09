import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CategoryChip } from '@/components/shared/CategoryChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { SearchInput } from '@/components/shared/SearchInput'
import { apakahTersedia, useMenuStore } from '@/features/menu/store/menu-store'
import { formatRupiah } from '@/lib/currency'
import { cn } from '@/lib/utils'
import type { FilterKategori, MenuItem } from '@/types/menu'

const FILTERS: FilterKategori[] = ['semua', 'lauk', 'sayur']

/** Baris aksi tabel/kartu: ubah, status, hapus (dengan konfirmasi sebaris). */
interface BarisAksiProps {
  menu: MenuItem
  konfirmasiHapus: boolean
  onMintaHapus: () => void
  onBatalkanHapus: () => void
}

function BarisAksi({ menu, konfirmasiHapus, onMintaHapus, onBatalkanHapus }: BarisAksiProps) {
  const tersedia = apakahTersedia(menu)
  const { toggleKetersediaan, hapus } = useMenuStore((state) => state)

  if (konfirmasiHapus) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">Hapus menu ini?</span>
        <button
          type="button"
          onClick={() => hapus(menu.id)}
          className="rounded-lg bg-destructive px-3 py-1.5 font-medium text-destructive-foreground transition-colors hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={onBatalkanHapus}
          className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Batal
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => toggleKetersediaan(menu.id)}
        aria-pressed={tersedia}
        aria-label={`Ubah ketersediaan ${menu.nama}`}
        title="Klik untuk mengubah ketersediaan"
      >
        <Badge variant={tersedia ? 'brand' : 'muted'} className="cursor-pointer">
          {tersedia ? 'Tersedia' : 'Habis'}
        </Badge>
      </button>

      <Link
        to={`/admin/menu/${menu.id}/edit`}
        aria-label={`Ubah ${menu.nama}`}
        className="flex size-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={onMintaHapus}
        aria-label={`Hapus ${menu.nama}`}
        className="flex size-8 items-center justify-center rounded-lg border border-border text-ink transition-colors hover:border-destructive hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-destructive"
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

/** Foto mini di baris tabel — nama file bila belum ada gambar asli. */
function FotoMini({ menu }: { menu: MenuItem }) {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-placeholder text-[0.6rem] text-muted-foreground">
      {menu.foto.replace(/\.[^.]+$/, '').slice(0, 2).toUpperCase()}
    </div>
  )
}

/** Kelola Menu — CRUD menu, harga, dan ketersediaan (Fase 2, MILIK LEAD). */
export function AdminMenuPage() {
  const items = useMenuStore((state) => state.items)
  const [pencarian, setPencarian] = useState('')
  const [kategori, setKategori] = useState<FilterKategori>('semua')
  const [idHapus, setIdHapus] = useState<string | null>(null)

  const hasil = useMemo(() => {
    const kata = pencarian.trim().toLowerCase()
    return items.filter((menu) => {
      const cocokKategori = kategori === 'semua' || menu.kategori === kategori
      const cocokPencarian = kata === '' || menu.nama.toLowerCase().includes(kata)
      return cocokKategori && cocokPencarian
    })
  }, [items, pencarian, kategori])

  const jumlahKategori = (kat: Exclude<FilterKategori, 'semua'>) =>
    items.filter((menu) => menu.kategori === kat).length

  return (
    <div>
      {/* ── Kepala halaman ──────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-medium text-ink">Kelola Menu</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length} menu terdaftar ·{' '}
            <span className="text-ink">{jumlahKategori('lauk')} lauk</span> ·{' '}
            <span className="text-ink">{jumlahKategori('sayur')} sayur</span>
          </p>
        </div>
        <Link to="/admin/menu/baru" className="btn-accent w-full sm:w-auto">
          <Plus className="size-4" aria-hidden="true" />
          Tambah menu
        </Link>
      </div>

      {/* ── Filter ──────────────────────────────────────── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-1" role="group" aria-label="Filter kategori">
          {FILTERS.map((filter) => (
            <CategoryChip
              key={filter}
              kategori={filter}
              aktif={kategori === filter}
              onSelect={setKategori}
            />
          ))}
        </div>
        <SearchInput value={pencarian} onChange={setPencarian} className="sm:w-64" />
      </div>

      {/* ── Data ────────────────────────────────────────── */}
      {hasil.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            judul="Menu tidak ditemukan"
            deskripsi={
              pencarian
                ? `Tidak ada menu yang cocok dengan "${pencarian}".`
                : 'Belum ada menu pada filter ini.'
            }
          />
        </div>
      ) : (
        <>
          {/* Tabel — layar besar */}
          <div className="mt-6 hidden rounded-xl border border-border bg-surface shadow-card lg:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead className="text-right">Status &amp; Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hasil.map((menu) => (
                  <TableRow key={menu.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <FotoMini menu={menu} />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{menu.nama}</p>
                          <p className="truncate text-xs text-muted-foreground">{menu.foto}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {menu.kategori}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-ink">
                      Rp{formatRupiah(menu.harga)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <BarisAksi
                          menu={menu}
                          konfirmasiHapus={idHapus === menu.id}
                          onMintaHapus={() => setIdHapus(menu.id)}
                          onBatalkanHapus={() => setIdHapus(null)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Kartu — layar kecil */}
          <ul className="mt-6 flex flex-col gap-4 lg:hidden">
            {hasil.map((menu) => {
              const tersedia = apakahTersedia(menu)
              return (
                <li
                  key={menu.id}
                  className={cn(
                    'rounded-xl border border-border bg-surface p-4 shadow-card',
                    !tersedia && 'opacity-75',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <FotoMini menu={menu} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{menu.nama}</p>
                        <Badge variant="outline" className="capitalize">
                          {menu.kategori}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-ink">
                        Rp{formatRupiah(menu.harga)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-border pt-3">
                    <BarisAksi
                      menu={menu}
                      konfirmasiHapus={idHapus === menu.id}
                      onMintaHapus={() => setIdHapus(menu.id)}
                      onBatalkanHapus={() => setIdHapus(null)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
