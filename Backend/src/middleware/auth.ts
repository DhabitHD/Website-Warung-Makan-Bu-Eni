import { timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'
import { env } from '../config/env'
import { GalatApi } from '../lib/galat'

function sama(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB)
}

/**
 * Penjaga endpoint pemilik (KONTRAK-API bagian 7, tahap awal: token statis).
 * Bila PEMILIK_TOKEN belum diatur, semua akses pemilik ditolak.
 */
export const wajibPemilik: RequestHandler = (req, _res, next) => {
  const token = env.PEMILIK_TOKEN
  const header = req.header('authorization') ?? ''
  const cocok = /^Bearer (.+)$/.exec(header)

  if (!token || !cocok || !sama(cocok[1] ?? '', token)) {
    next(new GalatApi(401, 'TANPA_HAK', 'Token pemilik tidak sah atau belum diberikan.'))
    return
  }
  next()
}
