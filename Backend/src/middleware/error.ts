import type { ErrorRequestHandler, RequestHandler } from 'express'

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
 * Penangkap galat server (500).
 * Detail galat internal tidak dibocorkan ke klien pada produksi.
 */
export const penanganGalat: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({
    galat: {
      kode: 'SERVER',
      pesan: 'Terjadi kesalahan pada server. Coba lagi nanti.',
    },
  })
}
