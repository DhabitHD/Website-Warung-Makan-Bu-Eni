import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Send } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/features/cart/store/cart-store'
import { cn } from '@/lib/utils'
import type { CartItem } from '@/types/cart'
import { checkoutSchema, type CheckoutFormValues } from '../schemas/checkout'
import { kirimPesanan } from '../services/order.service'

interface CheckoutFormProps {
  items: CartItem[]
  totalHarga: number
  nomorMejaAwal: string
}

const INPUT_KELAS =
  'h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20'

function PesanError({ id, pesan }: { id: string; pesan?: string }) {
  if (!pesan) return null

  return (
    <p id={id} role="alert" className="text-xs font-medium text-destructive">
      {pesan}
    </p>
  )
}

/** Form data pemesan + pengiriman pesanan (mock sampai API Tahap 4 siap). */
export function CheckoutForm({ items, totalHarga, nomorMejaAwal }: CheckoutFormProps) {
  const navigate = useNavigate()
  const kosongkan = useCartStore((state) => state.kosongkan)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { nama: '', nomorMeja: nomorMejaAwal, catatan: '' },
  })

  const mutasi = useMutation({
    mutationFn: (values: CheckoutFormValues) =>
      kirimPesanan({
        nama: values.nama,
        nomorMeja: values.nomorMeja,
        catatan: values.catatan || undefined,
        items,
        totalHarga,
      }),
    onSuccess: (pesanan) => {
      kosongkan()
      navigate('/order-success', { replace: true, state: { pesanan } })
    },
  })

  const onSubmit = handleSubmit((values) => mutasi.mutate(values))

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="judul-data-pemesan"
      className="rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6"
    >
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="judul-data-pemesan" className="font-display text-2xl font-medium text-ink">
          Data pemesan
        </h2>
        <span className="text-xs text-muted-foreground">* wajib</span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        Isi nama dan nomor meja supaya pesananmu mudah dicari warung.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="nama" className="text-sm font-medium text-ink">
            Nama pemesan <span className="text-accent">*</span>
          </label>
          <input
            id="nama"
            type="text"
            autoComplete="name"
            placeholder="Contoh: Siti"
            aria-invalid={errors.nama ? true : undefined}
            aria-describedby={errors.nama ? 'nama-error' : undefined}
            {...register('nama')}
            className={cn(INPUT_KELAS, errors.nama && 'border-destructive')}
          />
          <PesanError id="nama-error" pesan={errors.nama?.message} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nomorMeja" className="text-sm font-medium text-ink">
            Nomor meja <span className="text-accent">*</span>
          </label>
          <input
            id="nomorMeja"
            type="text"
            autoComplete="off"
            placeholder="Contoh: A01"
            aria-invalid={errors.nomorMeja ? true : undefined}
            aria-describedby={errors.nomorMeja ? 'nomor-meja-error' : 'nomor-meja-bantuan'}
            {...register('nomorMeja')}
            className={cn(INPUT_KELAS, errors.nomorMeja && 'border-destructive')}
          />
          {errors.nomorMeja ? (
            <PesanError id="nomor-meja-error" pesan={errors.nomorMeja.message} />
          ) : (
            <p id="nomor-meja-bantuan" className="text-xs text-muted-foreground">
              {nomorMejaAwal
                ? 'Terisi otomatis dari QR meja. Kamu bisa mengubahnya bila perlu.'
                : 'Masukkan nomor meja yang tertera pada QR di meja.'}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="catatan" className="text-sm font-medium text-ink">
            Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
          </label>
          <textarea
            id="catatan"
            rows={3}
            placeholder="Contoh: tanpa sambal, nasi 2"
            aria-invalid={errors.catatan ? true : undefined}
            aria-describedby={errors.catatan ? 'catatan-error' : 'catatan-bantuan'}
            {...register('catatan')}
            className={cn(
              INPUT_KELAS,
              'h-auto min-h-24 resize-y py-2.5',
              errors.catatan && 'border-destructive',
            )}
          />
          {errors.catatan ? (
            <PesanError id="catatan-error" pesan={errors.catatan.message} />
          ) : (
            <p id="catatan-bantuan" className="text-xs text-muted-foreground">
              Maksimal 200 karakter.
            </p>
          )}
        </div>
      </div>

      {mutasi.isError && (
        <div
          role="alert"
          className="mt-5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {mutasi.error instanceof Error
            ? mutasi.error.message
            : 'Pesanan gagal dikirim. Coba lagi.'}
        </div>
      )}

      <Button type="submit" variant="accent" className="mt-6 w-full" disabled={mutasi.isPending}>
        {mutasi.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Mengirim pesanan...
          </>
        ) : (
          <>
            <Send className="size-4" aria-hidden="true" />
            Kirim pesanan
          </>
        )}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Pembayaran dilakukan langsung di kasir warung.
      </p>
    </form>
  )
}
