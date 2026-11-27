import { Pool, type PoolClient } from 'pg'
import { env } from '../config/env'
import { GalatApi } from '../lib/galat'

let pool: Pool | undefined

export function dapatkanPool(): Pool {
  if (!env.DATABASE_URL) {
    throw new GalatApi(500, 'SERVER', 'Database belum dikonfigurasi.')
  }
  pool ??= new Pool({ connectionString: env.DATABASE_URL, max: 10 })
  return pool
}

/** Menjalankan fn dalam satu transaksi; ROLLBACK otomatis bila fn melempar galat. */
export async function dalamTransaksi<T>(fn: (klien: PoolClient) => Promise<T>): Promise<T> {
  const klien = await dapatkanPool().connect()
  try {
    await klien.query('BEGIN')
    const hasil = await fn(klien)
    await klien.query('COMMIT')
    return hasil
  } catch (error) {
    await klien.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    klien.release()
  }
}

/** Menutup pool; dipakai skrip dan pengujian agar proses bisa selesai. */
export async function tutupPool(): Promise<void> {
  await pool?.end()
  pool = undefined
}
