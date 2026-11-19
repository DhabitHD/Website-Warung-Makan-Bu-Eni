import { config } from 'dotenv'
import { z } from 'zod'

config()

/**
 * Variabel lingkungan wajib — divalidasi Zod saat server mulai.
 * Kredensial tidak pernah dicetak ke log.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL wajib diisi.').optional(),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
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
