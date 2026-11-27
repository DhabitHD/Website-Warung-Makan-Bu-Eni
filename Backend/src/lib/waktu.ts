/** Tanggal hari ini di Asia/Jakarta dalam format YYYY-MM-DD. */
export function tanggalWibHariIni(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}
