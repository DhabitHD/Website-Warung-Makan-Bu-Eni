import { Router } from 'express'
import { dalamTransaksi, dapatkanPool } from '../db/pool'
import { GalatApi } from '../lib/galat'
import { petaMenu, type MenuRow } from '../lib/pemetaan'
import { kategoriMenu, menuBaru, menuUbah, uraikan } from '../lib/skema'
import { wajibPemilik } from '../middleware/auth'

export const ruteMenu = Router()

const KOLOM = 'id, nama, kategori, harga, porsi, foto, keterangan_rasa, tersedia'

/** Pencarian memakai ILIKE; karakter % dan _ dari pengguna harus dianggap biasa. */
function hindariWildcard(teks: string): string {
  return teks.replace(/[\\%_]/g, (karakter) => `\\${karakter}`)
}

/** GET /menu — publik. Menu habis tetap ikut (KONTRAK-API 4.1). */
ruteMenu.get('/', async (req, res) => {
  const kategori = typeof req.query.kategori === 'string' ? uraikan(kategoriMenu, req.query.kategori) : null
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  const { rows } = await dapatkanPool().query<MenuRow>(
    `SELECT ${KOLOM} FROM menu
     WHERE ($1::text IS NULL OR kategori = $1::text)
       AND ($2::text = '' OR nama ILIKE '%' || $2::text || '%')
     ORDER BY id`,
    [kategori, hindariWildcard(q)],
  )
  res.json({ data: rows.map(petaMenu) })
})

/** GET /menu/:id — publik. */
ruteMenu.get('/:id', async (req, res) => {
  const { rows } = await dapatkanPool().query<MenuRow>(`SELECT ${KOLOM} FROM menu WHERE id = $1`, [req.params.id])
  if (!rows[0]) {
    throw new GalatApi(404, 'TIDAK_DITEMUKAN', 'Menu tidak ditemukan.')
  }
  res.json({ data: petaMenu(rows[0]) })
})

/**
 * POST /menu — pemilik. Id dibuat server: awalan L/S + nomor berikutnya (L12, S08).
 * Nomor dihitung di dalam transaksi; dua permintaan bersamaan yang memakai nomor
 * sama akan gagal di kunci utama dan dibalas 409 (bisa diulang).
 */
ruteMenu.post('/', wajibPemilik, async (req, res) => {
  const data = uraikan(menuBaru, req.body)
  const awalan = data.kategori === 'lauk' ? 'L' : 'S'

  const menu = await dalamTransaksi(async (klien) => {
    const { rows: [hitung] } = await klien.query<{ nomor: number }>(
      `SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INT)), 0) + 1 AS nomor
       FROM menu WHERE LEFT(id, 1) = $1`,
      [awalan],
    )
    const id = `${awalan}${String(hitung!.nomor).padStart(2, '0')}`
    const { rows } = await klien.query<MenuRow>(
      `INSERT INTO menu (id, nama, kategori, harga, porsi, foto, keterangan_rasa, tersedia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING ${KOLOM}`,
      [id, data.nama, data.kategori, data.harga, data.porsi ?? null, data.foto, data.keteranganRasa ?? null, data.tersedia ?? true],
    )
    return rows[0]!
  })

  res.status(201).json({ data: petaMenu(menu) })
})

/** PATCH /menu/:id — pemilik. Kategori tidak bisa diubah (menolak dengan 400 lewat skema). */
ruteMenu.patch('/:id', wajibPemilik, async (req, res) => {
  const data = uraikan(menuUbah, req.body)

  const kolomDb: Record<string, string> = {
    nama: 'nama',
    harga: 'harga',
    porsi: 'porsi',
    foto: 'foto',
    keteranganRasa: 'keterangan_rasa',
    tersedia: 'tersedia',
  }

  const nilai: unknown[] = []
  const atur = Object.entries(data).map(([kunci, isi]) => {
    nilai.push(isi ?? null)
    return `${kolomDb[kunci]} = $${nilai.length}`
  })
  nilai.push(req.params.id)

  const { rows } = await dapatkanPool().query<MenuRow>(
    `UPDATE menu SET ${atur.join(', ')}, diperbarui_pada = now()
     WHERE id = $${nilai.length}
     RETURNING ${KOLOM}`,
    nilai,
  )
  if (!rows[0]) {
    throw new GalatApi(404, 'TIDAK_DITEMUKAN', 'Menu tidak ditemukan.')
  }
  res.json({ data: petaMenu(rows[0]) })
})
