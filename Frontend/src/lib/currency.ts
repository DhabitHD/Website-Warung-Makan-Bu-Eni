/** Format angka ke rupiah tanpa simbol Rp (Rp sudah ditulis terpisah di UI). */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

/** Format angka ke rupiah penuh, contoh: Rp11.000 */
export function formatRupiahFull(value: number): string {
  return `Rp${formatRupiah(value)}`
}
