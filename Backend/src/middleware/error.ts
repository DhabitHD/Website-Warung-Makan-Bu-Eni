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
 * Penangkap galat server.
 * Galat dari klien (JSON rusak, body terlalu besar) dibalas 400/413 dengan kode
 * MASUKAN_TIDAK_SAH. Detail galat internal tidak dibocorkan ke klien.
 */
export const penanganGalat: ErrorRequestHandler = (err, _req, res, _next) => {
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
