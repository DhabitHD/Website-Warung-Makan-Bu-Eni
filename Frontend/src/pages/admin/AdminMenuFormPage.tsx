import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Save } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { EmptyState } from '@/components/shared/EmptyState'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useMenuStore } from '@/features/menu/store/menu-store'
import type { KategoriMenu } from '@/types/menu'

/** Validasi form menu — harga disimpan sebagai angka Rupiah bulat. */
const menuSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, 'Nama menu minimal 2 karakter.')
    .max(60, 'Nama menu maksimal 60 karakter.'),
  kategori: z.enum(['lauk', 'sayur']),
  harga: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Harga hanya boleh angka, tanpa titik atau koma.')
    .transform(Number)
    .refine((nilai) => nilai >= 0 && nilai <= 10_000_000, 'Harga antara 0 dan 10.000.000.'),
  foto: z
    .string()
    .trim()
    .min(1, 'Nama file foto wajib diisi.')
    .max(80, 'Nama file terlalu panjang.'),
  deskripsi: z
    .string()
    .trim()
    .max(200, 'Deskripsi maksimal 200 karakter.'),
  tersedia: z.boolean(),
})

type MenuFormValues = z.input<typeof menuSchema>
/** Hasil setelah transformasi Zod — `harga` sudah berupa number. */
type MenuParsedValues = z.output<typeof menuSchema>

const KATEGORI: { value: KategoriMenu; label: string }[] = [
  { value: 'lauk', label: 'Lauk' },
  { value: 'sayur', label: 'Sayur' },
]

/**
 * Form tambah / ubah menu (Fase 2 — MILIK LEAD).
 * Tanpa `:id` = tambah; dengan `:id` = edit (pra-isi dari store).
 */
export function AdminMenuFormPage() {
  const { id } = useParams()
  const modeEdit = Boolean(id)
  const navigate = useNavigate()
  const items = useMenuStore((state) => state.items)
  const simpan = useMenuStore((state) => state.simpan)
  const menuLama = modeEdit ? items.find((item) => item.id === id) : undefined

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MenuFormValues, unknown, MenuParsedValues>({
    resolver: zodResolver(menuSchema),
    defaultValues: menuLama
      ? {
          nama: menuLama.nama,
          kategori: menuLama.kategori,
          harga: String(menuLama.harga),
          foto: menuLama.foto,
          deskripsi: menuLama.deskripsi ?? '',
          tersedia: menuLama.tersedia !== false,
        }
      : {
          nama: '',
          kategori: 'lauk',
          harga: '',
          foto: '',
          deskripsi: '',
          tersedia: true,
        },
  })

  // Mode edit tapi menu tidak ada (sudah dihapus / id salah).
  if (modeEdit && !menuLama) {
    return (
      <div>
        <EmptyState
          judul="Menu tidak ditemukan"
          deskripsi="Menu yang ingin diedit mungkin sudah dihapus."
        />
        <div className="mt-6 flex justify-center">
          <Link to="/admin/menu" className="btn-outline w-auto px-4">
            Kembali ke Kelola Menu
          </Link>
        </div>
      </div>
    )
  }

  const onSubmit = (values: MenuParsedValues) => {
    simpan({
      id: menuLama?.id ?? `menu-${Date.now().toString(36)}`,
      nama: values.nama,
      kategori: values.kategori,
      harga: values.harga,
      foto: values.foto,
      deskripsi: values.deskripsi.trim() === '' ? undefined : values.deskripsi,
      tersedia: values.tersedia,
    })
    navigate('/admin/menu')
  }

  const galatUmum = (Object.keys(errors) as (keyof MenuFormValues)[]).length > 0

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/admin/menu"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Kelola Menu
      </Link>

      <h1 className="mt-4 font-display text-3xl font-medium text-ink">
        {modeEdit ? 'Ubah Menu' : 'Tambah Menu Baru'}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {modeEdit
          ? 'Perbarui nama, harga, kategori, atau ketersediaan menu.'
          : 'Lengkapi data menu baru untuk tampil di halaman pelanggan.'}
      </p>

      <form
        noValidate
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card sm:p-6"
      >
        {galatUmum && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            Ada isian yang belum benar — periksa merah di bawah.
          </p>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nama">Nama menu</Label>
            <Input
              id="nama"
              placeholder="contoh: Tempe Garit"
              aria-invalid={Boolean(errors.nama)}
              {...register('nama')}
            />
            {errors.nama && <p className="text-xs text-destructive">{errors.nama.message}</p>}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kategori">Kategori</Label>
              <select
                id="kategori"
                className="flex h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-ink focus:border-brand focus:ring-2 focus:ring-brand/20 focus:outline-none"
                {...register('kategori')}
              >
                {KATEGORI.map((kat) => (
                  <option key={kat.value} value={kat.value}>
                    {kat.label}
                  </option>
                ))}
              </select>
              {errors.kategori && (
                <p className="text-xs text-destructive">{errors.kategori.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="harga">Harga (Rp)</Label>
              <Input
                id="harga"
                inputMode="numeric"
                placeholder="contoh: 2000"
                aria-invalid={Boolean(errors.harga)}
                {...register('harga')}
              />
              {errors.harga && <p className="text-xs text-destructive">{errors.harga.message}</p>}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="foto">Nama file foto</Label>
            <Input
              id="foto"
              placeholder="contoh: tempegarit.jpg"
              aria-invalid={Boolean(errors.foto)}
              {...register('foto')}
            />
            {errors.foto && <p className="text-xs text-destructive">{errors.foto.message}</p>}
            <p className="text-xs text-muted-foreground">
              Gambar asli menyusul bersama penyimpanan file (Tahap 4).
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="deskripsi">Deskripsi (opsional)</Label>
            <Textarea
              id="deskripsi"
              placeholder="contoh: Tempe digarit bumbu ungkep, digoreng kering."
              aria-invalid={Boolean(errors.deskripsi)}
              {...register('deskripsi')}
            />
            {errors.deskripsi && (
              <p className="text-xs text-destructive">{errors.deskripsi.message}</p>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-brand"
              {...register('tersedia')}
            />
            <span className="text-sm">
              <span className="font-medium text-ink">Tersedia dijual</span>
              <span className="block text-xs text-muted-foreground">
                Matikan bila menu sedang habis — pelanggan tidak bisa menambahnya.
              </span>
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            to="/admin/menu"
            className="btn-outline w-full px-5 sm:w-auto"
          >
            Batal
          </Link>
          <button type="submit" disabled={isSubmitting} className="btn-accent w-full sm:w-auto">
            <Save className="size-4" aria-hidden="true" />
            {isSubmitting ? 'Menyimpan…' : modeEdit ? 'Simpan perubahan' : 'Tambah menu'}
          </button>
        </div>
      </form>
    </div>
  )
}
