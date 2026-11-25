import { config } from 'dotenv'
import { z } from 'zod'

config()

/**
 * Variabel lingkungan — divalidasi Zod saat server mulai.
 * Kredensial tidak pernah dicetak ke log.
 * DATABASE_URL dan AI_* baru dipakai pada Tahap 2–3; sudah didaftarkan di sini
 * agar nama dan aturannya tercatat sejak awal (sesuai KONTRAK-API.md).
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1).optional(),
  PEMILIK_TOKEN: z
    .string()
    .min(16, 'PEMILIK_TOKEN minimal 16 karakter.')
    .optional(),
  AI_TIMEOUT_MS: z.coerce.number().int().min(500).max(30000).default(8000),
  AI_BASE_URL: z.string().url().optional(),
  AI_API_KEY: z.string().min(1).optional(),
})

const hasil = envSchema.safeParse(process.env)

if (!hasil.success) {
  console.error('Variabel lingkungan tidak valid:')
  for (const masalah of hasil.error.issues) {
    console.error(` - ${masalah.path.join('.')}: ${masalah.message}`)
  }
  process.exit(1)
}

export const env = hasil.data
