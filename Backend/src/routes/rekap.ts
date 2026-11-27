import { Router } from 'express'
import { dapatkanPool } from '../db/pool'
import { rekapQuery, uraikan } from '../lib/skema'
import { wajibPemilik } from '../middleware/auth'

export const ruteRekap = Router()

/**
 * GET /rekap — pemilik. Hanya pesanan dibayar (basis dibayar_pada, WIB) dan
 * data_uji = false yang masuk pemasukan. Periode kosong → nol (SKEMA 6.1).
 */
ruteRekap.get('/', wajibPemilik, async (req, res) => {
  const { dari, sampai } = uraikan(rekapQuery, req.query)
  const { rows: [r] } = await dapatkanPool().query<{
    pemasukan: string
    pengeluaran: string
    jumlah_dibayar: string
    jumlah_masuk: string
  }>(
    `WITH pemasukan AS (
       SELECT COALESCE(SUM(total_harga), 0) AS nilai, COUNT(*) AS jumlah
       FROM pesanan
       WHERE pembayaran = 'dibayar' AND data_uji = false
         AND (dibayar_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1::date AND $2::date
     ),
     pengeluaran_periode AS (
       SELECT COALESCE(SUM(nominal), 0) AS nilai FROM pengeluaran
       WHERE data_uji = false AND tanggal BETWEEN $1::date AND $2::date
     ),
     pesanan_masuk AS (
       SELECT COUNT(*) AS jumlah FROM pesanan
       WHERE status <> 'batal' AND data_uji = false
         AND (dibuat_pada AT TIME ZONE 'Asia/Jakarta')::date BETWEEN $1::date AND $2::date
     )
     SELECT pemasukan.nilai AS pemasukan,
            pengeluaran_periode.nilai AS pengeluaran,
            pemasukan.jumlah AS jumlah_dibayar,
            pesanan_masuk.jumlah AS jumlah_masuk
     FROM pemasukan, pengeluaran_periode, pesanan_masuk`,
    [dari, sampai],
  )

  const pemasukan = Number(r!.pemasukan)
  const pengeluaran = Number(r!.pengeluaran)
  res.json({
    data: {
      periode: { dari, sampai },
      pemasukan,
      pengeluaran,
      saldoArusKas: pemasukan - pengeluaran,
      jumlahPesananDibayar: Number(r!.jumlah_dibayar),
      jumlahPesananMasuk: Number(r!.jumlah_masuk),
    },
  })
})
