import { Router } from 'express'

export const ruteHealth = Router()

/**
 * GET /api/v1/health — penanda kesiapan sebelum demonstrasi.
 * Koneksi PostgreSQL menyusul pada Tahap 2; untuk sekarang hanya status server.
 */
ruteHealth.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    layanan: 'warung-makan-bu-eni-api',
    waktu: new Date().toISOString(),
  })
})
