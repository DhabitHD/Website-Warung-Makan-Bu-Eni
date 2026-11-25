import { z, ZodError } from 'zod'

/**
 * Validasi payload pesanan sebelum dikirim.
 * Aturan jumlah (1–50) dan keranjang minimal satu baris mengikuti kontrak
 * `POST /api/v1/pesanan` bagian 4.3, sehingga server masih menjadi otoritas
 * tetapi klien sudah menolak masukan yang jelas salah.
 */
export const orderPayloadSchema = z.object({
  idPermintaan: z.uuid('Id pesanan tidak valid.'),
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
  catatan: z.string().trim().max(200, 'Catatan maksimal 200 karakter.').optional(),
  items: z
    .array(
      z.object({
        menuId: z.string().min(1, 'Menu tidak valid.'),
        jumlah: z
          .number()
          .int('Jumlah harus bilangan bulat.')
          .min(1, 'Jumlah minimal 1.')
          .max(50, 'Jumlah maksimal 50.'),
      }),
    )
    .min(1, 'Keranjang masih kosong. Tambahkan menu dulu, ya.'),
})

/** Pesan galat yang bisa dibaca pelanggan, termasuk dari `ZodError`. */
export function pesanGalatValidasi(error: unknown): string {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? 'Isian pesanan belum benar.'
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Pesanan gagal dikirim. Coba lagi.'
}
