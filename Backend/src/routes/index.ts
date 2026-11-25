import { Router } from 'express'
import { ruteHealth } from './health'

/** Router utama /api/v1/ — daftarkan rute fitur di sini. */
export const ruteV1 = Router()

ruteV1.use('/health', ruteHealth)
