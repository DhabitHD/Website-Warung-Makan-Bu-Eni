import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '@/components/layout/Container'
import { PageShell } from '@/components/layout/PageShell'
import { EmptyState } from '@/components/shared/EmptyState'
import { hitungTotalHarga, useCartStore } from '@/features/cart/store/cart-store'
import { CheckoutForm } from '@/features/checkout/components/CheckoutForm'
import { CheckoutSummary } from '@/features/checkout/components/CheckoutSummary'
import { useNomorMeja } from '@/features/checkout/hooks/useNomorMeja'

export function CheckoutPage() {
  const items = useCartStore((state) => state.items)
  const totalHarga = hitungTotalHarga(items)
  const { nomorMeja } = useNomorMeja()

  const menuUrl = nomorMeja ? `/menu?table=${encodeURIComponent(nomorMeja)}` : '/menu'

  return (
    <PageShell>
      <Container className="py-10 pb-24 lg:pb-16">
        <header className="flex flex-col gap-4 border-b border-border pb-6">
          <Link
            to="/cart"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-brand hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke keranjang
          </Link>
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">
              Langkah terakhir
            </p>
            <h1 className="mt-2 font-display text-4xl font-medium text-ink sm:text-5xl">
              Checkout
            </h1>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">
              Lengkapi data pemesan. Pesanan akan langsung dikirim ke warung setelah kamu
              menekan tombol kirim.
            </p>
          </div>
        </header>

        {items.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              ikon={<ClipboardList className="size-7 text-muted-foreground" aria-hidden="true" />}
              judul="Belum ada pesanan untuk di-checkout"
              deskripsi="Keranjangmu masih kosong. Pilih lauk dan sayur dulu, lalu kembali ke halaman ini."
            />
            <div className="mt-6 flex justify-center">
              <Link to={menuUrl} className="btn-accent">
                Pilih menu dulu
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <CheckoutForm items={items} totalHarga={totalHarga} nomorMejaAwal={nomorMeja} />

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <CheckoutSummary items={items} nomorMeja={nomorMeja} />
            </aside>
          </div>
        )}
      </Container>
    </PageShell>
  )
}
