import { Router } from 'express'
import { env } from '../config/env'
import { dapatkanPool } from '../db/pool'

export const ruteHealth = Router()

/**
 * GET /api/v1/health — kesiapan server dan database (KONTRAK-API bagian 8).
 * 200 bila database terhubung; 503 bila gagal.
 */
ruteHealth.get('/', async (_req, res) => {
  if (!env.DATABASE_URL) {
    res.status(200).json({ status: 'ok', database: 'belum_dihubungkan' })
    return
  }
  try {
    await dapatkanPool().query('SELECT 1')
    res.status(200).json({ status: 'ok', database: 'ok' })
  } catch {
    res.status(503).json({ status: 'gagal', database: 'gagal' })
  }
})
