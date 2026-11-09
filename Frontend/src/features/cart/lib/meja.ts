const NOMOR_MEJA_KEY = 'warung.nomorMeja'

/** Simpan nomor meja untuk sesi tab ini (bertahan saat pindah halaman). */
export function simpanNomorMeja(nomorMeja: string): void {
  try {
    sessionStorage.setItem(NOMOR_MEJA_KEY, nomorMeja)
  } catch {
    // Penyimpanan bisa diblokir browser; nomor meja tetap bisa diisi manual.
  }
}

/** Baca nomor meja yang tersimpan di sesi tab ini. */
export function bacaNomorMeja(): string {
  try {
    return sessionStorage.getItem(NOMOR_MEJA_KEY) ?? ''
  } catch {
    return ''
  }
}

/**
 * URL QR adalah /menu?table=A01, tetapi link ke /cart dan /checkout berasal dari
 * komponen shared yang tidak meneruskan query string. Karena MenuPage mengimpor
 * store keranjang, nomor meja disimpan sekali saat store dimuat agar tidak hilang
 * ketika pelanggan berpindah halaman.
 */
export function simpanNomorMejaDariUrl(): void {
  if (typeof window === 'undefined') return

  const nomorMeja = new URLSearchParams(window.location.search).get('table')?.trim()
  if (nomorMeja) simpanNomorMeja(nomorMeja)
}
