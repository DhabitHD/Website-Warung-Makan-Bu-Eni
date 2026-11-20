import cors from 'cors'
import express from 'express'
import { env } from './config/env'
import { penanganGalat, tidakDitemukan } from './middleware/error'
import { ruteV1 } from './routes'

/** Susun aplikasi Express — dipakai server.ts dan pengujian. */
export function buatAplikasi() {
  const app = express()

  app.use(express.json({ limit: '1mb' }))
  app.use(cors({ origin: env.CORS_ORIGIN }))

  app.use('/api/v1', ruteV1)

  app.use(tidakDitemukan)
  app.use(penanganGalat)

  return app
}
