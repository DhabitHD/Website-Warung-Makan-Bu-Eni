/**
 * Memasang skema (db/schema.sql) dan, bila diminta, data contoh (db/fixtures/seed.sql).
 * Jalankan dari folder Backend/ pada database kosong:
 *   npm run db:migrasi            # skema saja
 *   npm run db:migrasi -- --seed  # skema + data contoh
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { dapatkanPool } from '../src/db/pool'

async function main(): Promise<void> {
  const pool = dapatkanPool()
  try {
    await pool.query(readFileSync(resolve('db/schema.sql'), 'utf8'))
    console.log('Skema terpasang.')

    if (process.argv.includes('--seed')) {
      await pool.query(readFileSync(resolve('db/fixtures/seed.sql'), 'utf8'))
      console.log('Data contoh terpasang.')
    }
  } finally {
    await pool.end()
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
