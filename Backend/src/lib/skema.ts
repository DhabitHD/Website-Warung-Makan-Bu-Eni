import { z } from 'zod'
import { dariZod } from './galat'
import { tanggalWibHariIni } from './waktu'

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Gunakan format YYYY-MM-DD.')
const bilanganBulat = z.number().int('Harus bilangan bulat.')

export const kategoriMenu = z.enum(['lauk', 'sayur'])
export const statusPesanan = z.enum(['masuk', 'diproses', 'selesai', 'batal'])
export const statusPembayaran = z.enum(['belum', 'dibayar'])

/** Sesuai KONTRAK-API bagian 5.5 dan form admin. */
const menuDasar = z.object({
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
  kategori: kategoriMenu,
  harga: bilanganBulat.min(0, 'Harga tidak boleh negatif.').max(10_000_000, 'Harga maksimal 10.000.000.'),
  foto: z.string().trim().min(1, 'Nama file foto wajib diisi.').max(80),
  porsi: z.string().trim().max(40).nullish(),
  keteranganRasa: z.string().trim().max(200).nullish(),
  tersedia: z.boolean().optional(),
})

export const menuBaru = menuDasar

/** Kategori tidak bisa diubah: awalan id (L/S) mengikuti kategori. */
export const menuUbah = menuDasar
  .omit({ kategori: true })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, 'Tidak ada data yang diubah.')

export const pesananBaru = z.object({
  idPermintaan: z.uuid('Id permintaan tidak valid.'),
  nama: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(60, 'Nama maksimal 60 karakter.'),
  nomorMeja: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9-]{1,10}$/, 'Gunakan huruf, angka, atau tanda hubung (maks 10).')
    .nullish(),
  catatan: z.string().trim().max(200, 'Catatan maksimal 200 karakter.').nullish(),
  items: z
    .array(
      z.object({
        menuId: z.string().min(1, 'Menu tidak valid.'),
        jumlah: bilanganBulat.min(1, 'Jumlah minimal 1.').max(50, 'Jumlah maksimal 50.'),
        hargaDiharapkan: bilanganBulat.min(0).optional(),
      }),
    )
    .min(1, 'Keranjang masih kosong.'),
})

export const ubahStatus = z.object({ status: statusPesanan })
export const ubahPembayaran = z.object({ pembayaran: statusPembayaran })

export const pesananQuery = z.object({
  status: statusPesanan.optional(),
  pembayaran: statusPembayaran.optional(),
  dari: tanggal.optional(),
  sampai: tanggal.optional(),
})

export const pengeluaranBaru = z.object({
  keterangan: z.string().trim().min(2, 'Keterangan minimal 2 karakter.').max(120),
  nominal: bilanganBulat.min(1, 'Nominal minimal Rp1.').max(100_000_000, 'Nominal maksimal Rp100.000.000.'),
  tanggal: tanggal.refine((nilai) => nilai <= tanggalWibHariIni(), 'Tanggal tidak boleh di masa depan.'),
})

export const pengeluaranQuery = z.object({
  dari: tanggal.optional(),
  sampai: tanggal.optional(),
})

export const rekapQuery = z
  .object({ dari: tanggal, sampai: tanggal })
  .refine((data) => data.dari <= data.sampai, {
    message: 'dari tidak boleh setelah sampai.',
    path: ['dari'],
  })

/** Menguraikan masukan dengan skema; galat dibalas 400 dengan rincian. */
export function uraikan<T extends z.ZodType>(skema: T, masukan: unknown): z.output<T> {
  const hasil = skema.safeParse(masukan)
  if (!hasil.success) {
    throw dariZod(hasil.error)
  }
  return hasil.data
}
