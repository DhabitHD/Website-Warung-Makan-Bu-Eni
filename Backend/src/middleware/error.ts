import type { ErrorRequestHandler, RequestHandler } from 'express'
import { GalatApi, dariGalatDb } from '../lib/galat'

/** Penangkap rute yang tidak dikenal (404). */
export const tidakDitemukan: RequestHandler = (req, res) => {
  res.status(404).json({
    galat: {
      kode: 'TIDAK_DITEMUKAN',
      pesan: `Rute ${req.method} ${req.path} tidak ditemukan.`,
    },
  })
}

/**
 * Penangkap galat terpusat. Urutan: galat API → galat constraint database →
 * galat klien dari body parser (400/413) → galat tak terduga (500, tanpa detail ke klien).
 */
export const penanganGalat: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof GalatApi) {
    res.status(err.status).json({
      galat: {
        kode: err.kode,
        pesan: err.message,
        ...(err.rincian ? { rincian: err.rincian } : {}),
      },
    })
    return
  }

  const galatDb = dariGalatDb(err)
  if (galatDb) {
    res.status(galatDb.status).json({ galat: { kode: galatDb.kode, pesan: galatDb.message } })
    return
  }

  const status = typeof err?.status === 'number' ? err.status : 500
  if (status >= 400 && status < 500) {
    res.status(status).json({
      galat: {
        kode: 'MASUKAN_TIDAK_SAH',
        pesan:
          err.type === 'entity.too.large'
            ? 'Data yang dikirim terlalu besar.'
            : 'Format data yang dikirim tidak sah.',
      },
    })
    return
  }

  console.error(err)
  res.status(500).json({
    galat: {
      kode: 'SERVER',
      pesan: 'Terjadi kesalahan pada server. Coba lagi nanti.',
    },
  })
}
