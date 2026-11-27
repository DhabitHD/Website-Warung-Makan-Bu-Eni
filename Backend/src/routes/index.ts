import { Router } from 'express'
import { rutePengeluaran } from './pengeluaran'
import { ruteHealth } from './health'
import { ruteMenu } from './menu'
import { rutePesanan } from './pesanan'
import { ruteRekap } from './rekap'

/** Router utama /api/v1/. */
export const ruteV1 = Router()

ruteV1.use('/health', ruteHealth)
ruteV1.use('/menu', ruteMenu)
ruteV1.use('/pesanan', rutePesanan)
ruteV1.use('/pengeluaran', rutePengeluaran)
ruteV1.use('/rekap', ruteRekap)
