import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { bacaNomorMeja, simpanNomorMeja } from '@/features/cart/lib/meja'

/**
 * Nomor meja dari URL QR (?table=A01), atau dari sesi tab yang sudah menyimpannya.
 * Nilai dari URL selalu disimpan ulang agar halaman berikutnya memakai meja terbaru.
 */
export function useNomorMeja() {
  const [searchParams] = useSearchParams()
  const dariUrl = searchParams.get('table')?.trim() ?? ''

  useEffect(() => {
    if (dariUrl) simpanNomorMeja(dariUrl)
  }, [dariUrl])

  return { nomorMeja: dariUrl || bacaNomorMeja(), dariUrl }
}
