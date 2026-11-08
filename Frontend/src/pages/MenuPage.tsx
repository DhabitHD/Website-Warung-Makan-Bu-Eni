import { SearchX } from 'lucide-react'
import { CartBar } from '@/components/shared/CartBar'
import { CategoryChip } from '@/components/shared/CategoryChip'
import { EmptyState } from '@/components/shared/EmptyState'
import { OrderSummaryCard } from '@/components/shared/OrderSummaryCard'
import { SearchInput } from '@/components/shared/SearchInput'
import { SectionHeading } from '@/components/shared/SectionHeading'
import { StatCard } from '@/components/shared/StatCard'
import { Container } from '@/components/layout/Container'
import { PageShell } from '@/components/layout/PageShell'
import { MenuItemCard } from '@/features/menu/components/MenuItemCard'
import { useMenuFilter } from '@/features/menu/hooks/useMenuFilter'
import { useCartStore } from '@/features/cart/store/cart-store'
import { MOCK_MENU } from '@/features/menu/services/menu.mock'
import type { FilterKategori, MenuItem } from '@/types/menu'

const FILTERS: FilterKategori[] = ['semua', 'lauk', 'sayur']

export function MenuPage() {
  const { hasil, grup, pencarian, setPencarian, kategori, setKategori, totalSemua } =
    useMenuFilter()

  const items = useCartStore((state) => state.items)
  const tambah = useCartStore((state) => state.tambah)

  const jumlahLauk = MOCK_MENU.filter((menu) => menu.kategori === 'lauk').length
  const jumlahSayur = MOCK_MENU.filter((menu) => menu.kategori === 'sayur').length

  const handleTambah = (menu: MenuItem) => tambah(menu)

  return (
    <PageShell>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="pt-8 pb-8 sm:pt-14">
        <Container className="grid items-start gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <h1 className="font-display text-4xl leading-[1.05] font-medium text-ink sm:text-6xl">
              Lauk lengkap,
              <br />
              <em className="font-normal text-accent">makan tenang.</em>
            </h1>
            <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
              Pilih lauk dan sayur favoritmu. Tambahkan ke pesanan, lalu lanjutkan ke checkout saat
              pilihanmu sudah lengkap.
            </p>
          </div>
          <div className="w-full max-w-xs lg:w-80">
            <StatCard totalMenu={totalSemua} jumlahLauk={jumlahLauk} jumlahSayur={jumlahSayur} />
          </div>
        </Container>
      </section>

      {/* ── Daftar menu: konten + sidebar ────────────────── */}
      <Container className="pb-24 lg:pb-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* Toolbar: judul + pencarian */}
            <div className="border-t border-border pt-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="flex items-baseline gap-2.5">
                  <span className="font-display text-2xl font-medium text-ink">Daftar menu</span>
                  <span className="text-sm text-muted-foreground">{hasil.length} pilihan</span>
                </h2>

                <SearchInput
                  value={pencarian}
                  onChange={setPencarian}
                  className="sm:w-56"
                />
              </div>
            </div>

            {/* Filter kategori — bilah melekat di bawah header di layar kecil,
                sehingga bisa ganti kategori satu sent kapan pun. */}
            <div
              role="group"
              aria-label="Filter kategori"
              className="sticky top-16 z-30 -mx-4 mt-4 flex items-center gap-1 bg-background px-4 pb-2 lg:mx-0 lg:static lg:bg-transparent lg:px-0 lg:pb-0"
            >
              {FILTERS.map((filter) => (
                <CategoryChip
                  key={filter}
                  kategori={filter}
                  aktif={kategori === filter}
                  onSelect={setKategori}
                />
              ))}
            </div>

            {/* Section per kategori */}
            {grup.length > 0 ? (
              <div className="mt-10 flex flex-col gap-12">
                {grup.map((g) => (
                  <section key={g.kategori}>
                    <SectionHeading
                      nomor={g.nomor}
                      judul={g.label}
                      label={`${g.menu.length} menu`}
                      className="mb-5"
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                      {g.menu.map((menu) => (
                        <MenuItemCard key={menu.id} menu={menu} onTambah={handleTambah} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="mt-10">
                <EmptyState
                  ikon={<SearchX className="size-7 text-muted-foreground" aria-hidden="true" />}
                  judul="Menu tidak ditemukan"
                  deskripsi={`Tidak ada menu yang cocok dengan pencarian "${pencarian}". Coba kata kunci lain.`}
                />
              </div>
            )}
          </div>

          {/* Sidebar ringkasan — sticky di desktop, menempel di bawah di mobile */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <OrderSummaryCard items={items} />
          </div>
        </div>
      </Container>
      <CartBar />
    </PageShell>
  )
}
