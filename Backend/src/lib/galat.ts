import type { ZodError } from 'zod'

export type KodeGalat =
  | 'MASUKAN_TIDAK_SAH'
  | 'MENU_HABIS'
  | 'TANPA_HAK'
  | 'AKSES_DITOLAK'
  | 'TIDAK_DITEMUKAN'
  | 'KONFLIK'
  | 'HARGA_BERUBAH'
  | 'SERVER'

export type Rincian = Record<string, string | number | null>

/** Galat yang sudah berbentuk kontrak API; dibalas apa adanya oleh penangan galat. */
export class GalatApi extends Error {
  readonly status: number
  readonly kode: KodeGalat
  readonly rincian?: Rincian[]

  constructor(status: number, kode: KodeGalat, pesan: string, rincian?: Rincian[]) {
    super(pesan)
    this.status = status
    this.kode = kode
    this.rincian = rincian
  }
}

/** Galat validasi Zod → 400 MASUKAN_TIDAK_SAH dengan rincian per field. */
export function dariZod(error: ZodError): GalatApi {
  return new GalatApi(
    400,
    'MASUKAN_TIDAK_SAH',
    'Ada isian yang belum benar.',
    error.issues.map((issue) => ({ field: issue.path.join('.'), pesan: issue.message })),
  )
}

/** Galat constraint database → balasan API. CHECK (23514) menjadi 409 sesuai SKEMA bagian 4.2. */
export function dariGalatDb(error: unknown): GalatApi | undefined {
  const kode = (error as { code?: unknown } | null)?.code
  if (kode === '23514') {
    return new GalatApi(409, 'KONFLIK', 'Perubahan ditolak karena melanggar aturan data.')
  }
  if (kode === '23505') {
    return new GalatApi(409, 'KONFLIK', 'Data sudah ada. Coba lagi.')
  }
  return undefined
}
