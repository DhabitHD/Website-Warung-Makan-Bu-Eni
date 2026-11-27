import { Router } from 'express'
import type { PoolClient } from 'pg'
import { dalamTransaksi, dapatkanPool } from '../db/pool'
import { GalatApi } from '../lib/galat'
import { petaPesanan, type ItemRow, type MenuRow, type PesananRow } from '../lib/pemetaan'
import { pesananBaru, pesananQuery, ubahPembayaran, ubahStatus, uraikan } from '../lib/skema'
import { wajibPemilik } from '../middleware/auth'

export const rutePesanan = Router()

const KOLOM_PESANAN =
  'id, nama_pelanggan, nomor_meja, catatan, status, pembayaran, total_harga, dibuat_pada, dibayar_pada'

/** Transisi status yang diizinkan (KONTRAK-API bagian 2.2). */
const TRANSISI: Record<PesananRow['status'], PesananRow['status'][]> = {
  masuk: ['diproses', 'batal'],
  diproses: ['selesai', 'batal'],
  selesai: [],
  batal: [],
}

type Penanya = Pick<PoolClient, 'query'>

async function ambilItem(penanya: Penanya, ids: string[]): Promise<Map<string, ItemRow[]>> {
  const peta = new Map<string, ItemRow[]>()
  if (ids.length === 0) return peta
  const { rows } = await penanya.query<ItemRow>(
    `SELECT pesanan_id, menu_id, nama, harga, jumlah, subtotal
     FROM item_pesanan WHERE pesanan_id = ANY($1::text[]) ORDER BY id`,
    [ids],
  )
  for (const item of rows) {
    const daftar = peta.get(item.pesanan_id) ?? []
    daftar.push(item)
    peta.set(item.pesanan_id, daftar)
  }
  return peta
}

async function muatBanyak(penanya: Penanya, baris: PesananRow[]) {
  const items = await ambilItem(penanya, baris.map((b) => b.id))
  return baris.map((b) => petaPesanan(b, items.get(b.id) ?? []))
}

async function muatSatu(penanya: Penanya, id: string) {
  const { rows } = await penanya.query<PesananRow>(`SELECT ${KOLOM_PESANAN} FROM pesanan WHERE id = $1`, [id])
  if (!rows[0]) {
    throw new GalatApi(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan.')
  }
  return (await muatBanyak(penanya, [rows[0]]))[0]!
}

async function muatDariPermintaan(penanya: Penanya, idPermintaan: string) {
  const { rows } = await penanya.query<PesananRow>(
    `SELECT ${KOLOM_PESANAN} FROM pesanan WHERE id_permintaan = $1`,
    [idPermintaan],
  )
  if (!rows[0]) return null
  return (await muatBanyak(penanya, [rows[0]]))[0]!
}

/**
 * POST /pesanan — publik. Mengikuti SKEMA bagian 4.1:
 * langkah 0 (cek id permintaan), lalu transaksi: kunci menu, validasi,
 * INSERT ... ON CONFLICT, dan item. Yang kalah dalam balapan dibalas 200 dengan pesanan pemenang.
 */
rutePesanan.post('/', async (req, res) => {
  const data = uraikan(pesananBaru, req.body)
  const pool = dapatkanPool()

  const sudahAda = await muatDariPermintaan(pool, data.idPermintaan)
  if (sudahAda) {
    res.status(200).json({ data: sudahAda })
    return
  }

  const hasil = await dalamTransaksi(async (klien) => {
    const idMenu = [...new Set(data.items.map((item) => item.menuId))]
    const { rows: menuRows } = await klien.query<MenuRow>(
      `SELECT id, nama, kategori, harga, porsi, foto, keterangan_rasa, tersedia
       FROM menu WHERE id = ANY($1::text[]) FOR SHARE`,
      [idMenu],
    )
    const menu = new Map(menuRows.map((baris) => [baris.id, baris]))

    const tidakDikenal = data.items.flatMap((item, indeks) =>
      menu.has(item.menuId) ? [] : [{ field: `items.${indeks}.menuId`, pesan: 'Menu tidak dikenal.' }],
    )
    if (tidakDikenal.length > 0) {
      throw new GalatApi(400, 'MASUKAN_TIDAK_SAH', 'Ada isian yang belum benar.', tidakDikenal)
    }

    const habis = data.items.filter((item) => menu.get(item.menuId)!.tersedia === false)
    if (habis.length > 0) {
      throw new GalatApi(
        400,
        'MENU_HABIS',
        'Ada menu yang sedang habis. Hapus dari pesanan lalu coba lagi.',
        habis.map((item) => ({ menuId: item.menuId, pesan: 'Sedang habis' })),
      )
    }

    const berubah = data.items.filter(
      (item) => item.hargaDiharapkan !== undefined && item.hargaDiharapkan !== menu.get(item.menuId)!.harga,
    )
    if (berubah.length > 0) {
      throw new GalatApi(
        409,
        'HARGA_BERUBAH',
        'Ada harga yang berubah. Periksa pesanan Anda sebelum mengirim.',
        berubah.map((item) => ({
          menuId: item.menuId,
          hargaDiharapkan: item.hargaDiharapkan!,
          hargaTerkini: menu.get(item.menuId)!.harga,
        })),
      )
    }

    const totalHarga = data.items.reduce(
      (total, item) => total + menu.get(item.menuId)!.harga * item.jumlah,
      0,
    )

    const { rows: [pesanan] } = await klien.query<PesananRow>(
      `INSERT INTO pesanan (id_permintaan, nama_pelanggan, nomor_meja, catatan, total_harga)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id_permintaan) DO NOTHING
       RETURNING ${KOLOM_PESANAN}`,
      [data.idPermintaan, data.nama, data.nomorMeja ?? null, data.catatan || null, totalHarga],
    )

    if (!pesanan) {
      return { dibuat: false as const }
    }

    for (const item of data.items) {
      const baris = menu.get(item.menuId)!
      await klien.query(
        `INSERT INTO item_pesanan (pesanan_id, menu_id, nama, harga, jumlah)
         VALUES ($1, $2, $3, $4, $5)`,
        [pesanan.id, baris.id, baris.nama, baris.harga, item.jumlah],
      )
    }

    return { dibuat: true as const, id: pesanan.id }
  })

  if (hasil.dibuat) {
    res.status(201).json({ data: await muatSatu(pool, hasil.id) })
    return
  }

  const pemenang = await muatDariPermintaan(pool, data.idPermintaan)
  if (!pemenang) {
    throw new Error(`Pesanan pemenang untuk ${data.idPermintaan} tidak ditemukan.`)
  }
  res.status(200).json({ data: pemenang })
})

/** GET /pesanan — pemilik. Daftar terbaru dulu, dengan filter (KONTRAK-API 5.1). */
rutePesanan.get('/', wajibPemilik, async (req, res) => {
  const filter = uraikan(pesananQuery, req.query)
  const { rows } = await dapatkanPool().query<PesananRow>(
    `SELECT ${KOLOM_PESANAN} FROM pesanan
     WHERE ($1::text IS NULL OR status = $1::text)
       AND ($2::text IS NULL OR pembayaran = $2::text)
       AND ($3::date IS NULL OR (dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date >= $3::date)
       AND ($4::date IS NULL OR (dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date <= $4::date)
     ORDER BY dibuat_pada DESC, id DESC`,
    [filter.status ?? null, filter.pembayaran ?? null, filter.dari ?? null, filter.sampai ?? null],
  )
  res.json({ data: await muatBanyak(dapatkanPool(), rows) })
})

/** GET /pesanan/:id — pemilik, versi lengkap (KONTRAK-API 5.2). */
rutePesanan.get('/:id', wajibPemilik, async (req, res) => {
  res.json({ data: await muatSatu(dapatkanPool(), String(req.params.id)) })
})

/**
 * PATCH /pesanan/:id/status — pemilik. Kunci optimistik: UPDATE hanya berhasil bila
 * status masih nilai lama dan tidak membatalkan pesanan yang sudah dibayar.
 */
rutePesanan.patch('/:id/status', wajibPemilik, async (req, res) => {
  const { status: ke } = uraikan(ubahStatus, req.body)
  const pool = dapatkanPool()
  const id = String(req.params.id)

  const { rows: [sekarang] } = await pool.query<PesananRow>(
    `SELECT ${KOLOM_PESANAN} FROM pesanan WHERE id = $1`,
    [id],
  )
  if (!sekarang) {
    throw new GalatApi(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan.')
  }
  if (sekarang.status === ke) {
    res.json({ data: await muatSatu(pool, id) })
    return
  }
  if (!TRANSISI[sekarang.status].includes(ke)) {
    throw new GalatApi(409, 'KONFLIK', `Status tidak bisa diubah dari ${sekarang.status} ke ${ke}.`)
  }
  if (ke === 'batal' && sekarang.pembayaran === 'dibayar') {
    throw new GalatApi(409, 'KONFLIK', "Pesanan sudah dibayar. Ubah pembayaran ke 'belum' dulu, lalu batalkan.")
  }

  const { rows } = await pool.query<PesananRow>(
    `UPDATE pesanan SET status = $3::text, diperbarui_pada = now()
     WHERE id = $1 AND status = $2::text
       AND NOT ($3::text = 'batal' AND pembayaran = 'dibayar')
     RETURNING ${KOLOM_PESANAN}`,
    [id, sekarang.status, ke],
  )
  if (rows[0]) {
    res.json({ data: await muatSatu(pool, id) })
    return
  }

  const ulang = await muatSatu(pool, id)
  if (ulang.status === ke) {
    res.json({ data: ulang })
    return
  }
  throw new GalatApi(409, 'KONFLIK', 'Status pesanan baru saja berubah. Muat ulang lalu coba lagi.')
})

/**
 * PATCH /pesanan/:id/pembayaran — pemilik. Menandai dibayar atau kembali ke belum.
 * dibayar_pada diisi/dikosongkan bersama; constraint database tetap penjaga terakhir.
 */
rutePesanan.patch('/:id/pembayaran', wajibPemilik, async (req, res) => {
  const { pembayaran: ke } = uraikan(ubahPembayaran, req.body)
  const pool = dapatkanPool()
  const id = String(req.params.id)

  const { rows: [sekarang] } = await pool.query<PesananRow>(
    `SELECT ${KOLOM_PESANAN} FROM pesanan WHERE id = $1`,
    [id],
  )
  if (!sekarang) {
    throw new GalatApi(404, 'TIDAK_DITEMUKAN', 'Pesanan tidak ditemukan.')
  }
  if (sekarang.pembayaran === ke) {
    res.json({ data: await muatSatu(pool, id) })
    return
  }
  if (ke === 'dibayar' && sekarang.status === 'batal') {
    throw new GalatApi(409, 'KONFLIK', 'Pesanan yang sudah dibatalkan tidak bisa ditandai dibayar.')
  }

  const { rows } = await pool.query<PesananRow>(
    `UPDATE pesanan
     SET pembayaran = $3::text,
         dibayar_pada = CASE WHEN $3::text = 'dibayar' THEN now() ELSE NULL END,
         diperbarui_pada = now()
     WHERE id = $1 AND pembayaran = $2::text AND status <> 'batal'
     RETURNING ${KOLOM_PESANAN}`,
    [id, sekarang.pembayaran, ke],
  )
  if (rows[0]) {
    res.json({ data: await muatSatu(pool, id) })
    return
  }

  const ulang = await muatSatu(pool, id)
  if (ulang.pembayaran === ke) {
    res.json({ data: ulang })
    return
  }
  throw new GalatApi(409, 'KONFLIK', 'Pembayaran pesanan baru saja berubah. Muat ulang lalu coba lagi.')
})
