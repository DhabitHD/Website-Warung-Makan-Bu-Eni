import { z } from 'zod'

/** Validasi form login admin — pesan memakai bahasa yang dibaca pemilik warung. */
export const loginSchema = z.object({
  username: z.string().trim().min(3, 'Username minimal 3 karakter.'),
  password: z.string().min(4, 'Password minimal 4 karakter.'),
})

export type LoginFormValues = z.infer<typeof loginSchema>
