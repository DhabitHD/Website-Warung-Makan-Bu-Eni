import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/shared/EmptyState'
import { CartItemRow } from '@/features/cart/components/CartItemRow'
import { CartSummary } from '@/features/cart/components/CartSummary'
import { bacaNomorMeja } from '@/features/cart/lib/meja'
import { useCartStore } from '@/features/cart/store/cart-store'

export function CartPage() {
  const items = useCartStore((state) => state.items)
  const ubahJumlah = useCartStore((state) => state.ubahJumlah)
  const hapus = useCartStore((state) => state.hapus)

  const nomorMeja = bacaNomorMeja()
  const menuUrl = nomorMeja ? `/menu?table=${encodeURIComponent(nomorMeja)}` : '/menu'
  const checkoutUrl = nomorMeja
    ? `/checkout?table=${encodeURIComponent(nomorMeja)}`
    : '/checkout'

  return (
    <PageShell>
      <Container className="py-10 pb-24 lg:pb-16">
        <header className="flex flex-col gap-3 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Pesananmu
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium text-ink sm:text-5xl">
              Keranjang
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Periksa jumlah porsi, lalu lanjut ke checkout saat pesananmu sudah lengkap.
            </p>
          </div>
          {nomorMeja && (
            <span className="inline-flex w-fit items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Meja {nomorMeja}
            </span>
          )}
        </header>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              ikon={<ShoppingBag className="size-7 text-muted-foreground" aria-hidden="true" />}
              judul="Keranjang masih kosong"
              deskripsi="Tambah lauk atau sayur favoritmu dulu, lalu kembali ke sini untuk checkout."
            />
            <div className="mt-6 flex justify-center">
              <Link to={menuUrl} className="btn-accent">
                Lihat daftar menu
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-labelledby="daftar-pesanan" className="min-w-0">
              <div className="rounded-xl border border-border bg-surface px-5 shadow-card">
                <h2 id="daftar-pesanan" className="sr-only">
                  Daftar pesanan
                </h2>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <CartItemRow
                      key={item.itemId}
                      item={item}
                      onUbahJumlah={ubahJumlah}
                      onHapus={hapus}
                    />
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={menuUrl}
                  className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Tambah menu lain
                </Link>
                <p className="text-xs text-muted-foreground">
                  Jumlah bisa diubah kapan saja sebelum checkout.
                </p>
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <CartSummary items={items} checkoutUrl={checkoutUrl} nomorMeja={nomorMeja} />
            </aside>
          </div>
        )}
      </Container>
    </PageShell>
  )
}
