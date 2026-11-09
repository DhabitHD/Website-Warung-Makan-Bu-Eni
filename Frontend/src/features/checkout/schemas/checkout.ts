import { z } from 'zod'

/** Validasi form checkout. Pesan error memakai bahasa yang dilihat pelanggan. */
export const checkoutSchema = z.object({
  nama: z
    .string()
    .trim()
    .min(2, 'Nama minimal 2 karakter.')
    .max(60, 'Nama maksimal 60 karakter.'),
  nomorMeja: z
    .string()
    .trim()
    .min(1, 'Nomor meja wajib diisi.')
    .max(10, 'Nomor meja maksimal 10 karakter.')
    .regex(/^[A-Za-z0-9-]+$/, 'Gunakan huruf, angka, atau tanda hubung.'),
  catatan: z.string().trim().max(200, 'Catatan maksimal 200 karakter.'),
})

export type CheckoutFormValues = z.infer<typeof checkoutSchema>
