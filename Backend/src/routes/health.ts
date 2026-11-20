import { Router } from 'express'

export const ruteHealth = Router()

/**
 * GET /api/v1/health — penanda kesiapan sebelum demonstrasi.
 * Field `database` sesuai KONTRAK-API.md bagian 8. Nilainya `belum_dihubungkan`
 * sampai koneksi PostgreSQL dipasang pada Tahap 2.
 */
ruteHealth.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    database: 'belum_dihubungkan',
  })
})
