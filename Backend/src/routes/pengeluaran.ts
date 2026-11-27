import { Router } from 'express'
import { dapatkanPool } from '../db/pool'
import { pengeluaranBaru, pengeluaranQuery, uraikan } from '../lib/skema'
import { wajibPemilik } from '../middleware/auth'

export const rutePengeluaran = Router()

interface PengeluaranRow {
  id: string
  keterangan: string
  nominal: number
  tanggal: string
  dibuat_pada: Date
}

function petaPengeluaran(baris: PengeluaranRow) {
  return {
    id: Number(baris.id),
    keterangan: baris.keterangan,
    nominal: Number(baris.nominal),
    tanggal: baris.tanggal,
    dibuatPada: baris.dibuat_pada.toISOString(),
  }
}

/** POST /pengeluaran — pemilik (KONTRAK-API 5.6). */
rutePengeluaran.post('/', wajibPemilik, async (req, res) => {
  const data = uraikan(pengeluaranBaru, req.body)
  const { rows } = await dapatkanPool().query<PengeluaranRow>(
    `INSERT INTO pengeluaran (keterangan, nominal, tanggal)
     VALUES ($1, $2, $3::date)
     RETURNING id, keterangan, nominal, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, dibuat_pada`,
    [data.keterangan, data.nominal, data.tanggal],
  )
  res.status(201).json({ data: petaPengeluaran(rows[0]!) })
})

/** GET /pengeluaran — pemilik. Query dari dan sampai bersifat opsional. */
rutePengeluaran.get('/', wajibPemilik, async (req, res) => {
  const filter = uraikan(pengeluaranQuery, req.query)
  const { rows } = await dapatkanPool().query<PengeluaranRow>(
    `SELECT id, keterangan, nominal, to_char(tanggal, 'YYYY-MM-DD') AS tanggal, dibuat_pada
     FROM pengeluaran
     WHERE data_uji = false
       AND ($1::date IS NULL OR tanggal >= $1::date)
       AND ($2::date IS NULL OR tanggal <= $2::date)
     ORDER BY tanggal DESC, id DESC`,
    [filter.dari ?? null, filter.sampai ?? null],
  )
  res.json({ data: rows.map(petaPengeluaran) })
})
