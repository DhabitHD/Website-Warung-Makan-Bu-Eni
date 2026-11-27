/**
 * Uji API terhadap PostgreSQL sungguhan (lihat scripts/uji-api.sh).
 * Kasus T-A1..T-A12 dari SKEMA-POSTGRESQL.md Lampiran A.4 dijalankan di sini.
 * Data awal: db/fixtures/seed.sql (6 menu, 5 pesanan, 2 pengeluaran).
 */
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

const TOKEN = process.env.PEMILIK_TOKEN ?? ''
let server: Server
let base = ''

interface Balasan {
  status: number
  json: any
}

async function panggil(
  metode: string,
  jalur: string,
  opsi: { token?: string | null; body?: unknown } = {},
): Promise<Balasan> {
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (opsi.token) headers.authorization = `Bearer ${opsi.token}`
  const res = await fetch(base + jalur, {
    method: metode,
    headers,
    body: opsi.body === undefined ? undefined : JSON.stringify(opsi.body),
  })
  return { status: res.status, json: await res.json().catch(() => null) }
}

const owner = (metode: string, jalur: string, body?: unknown) =>
  panggil(metode, jalur, { token: TOKEN, body })

const pesan = (items: unknown[], nama = 'Uji Pelanggan', extra: Record<string, unknown> = {}) => ({
  idPermintaan: randomUUID(),
  nama,
  nomorMeja: 'A01',
  items,
  ...extra,
})

async function buatPesanan(nama: string, items = [{ menuId: 'L10', jumlah: 1 }]) {
  const balasan = await panggil('POST', '/pesanan', { body: pesan(items, nama) })
  assert.equal(balasan.status, 201, JSON.stringify(balasan.json))
  return balasan.json.data as { id: string; totalHarga: number }
}

async function cariPesananOwner(nama: string) {
  const daftar = await owner('GET', '/pesanan')
  const hasil = daftar.json.data.find((p: { nama: string }) => p.nama === nama)
  assert.ok(hasil, `pesanan ${nama} tidak ditemukan`)
  return hasil as { id: string }
}

before(async () => {
  process.env.PEMILIK_TOKEN ??= 'uji-token-minimal-16-karakter'
  const { buatAplikasi } = await import('../src/app')
  const app = buatAplikasi()
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s))
  })
  const { port } = server.address() as AddressInfo
  base = `http://127.0.0.1:${port}/api/v1`
})

after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  const { tutupPool } = await import('../src/db/pool')
  await tutupPool()
})

test('health: database terhubung', async () => {
  const r = await panggil('GET', '/health')
  assert.equal(r.status, 200)
  assert.deepEqual(r.json, { status: 'ok', database: 'ok' })
})

test('GET /menu: publik, memuat menu habis, dan memfilter kategori', async () => {
  const semua = await panggil('GET', '/menu')
  assert.equal(semua.status, 200)
  assert.equal(semua.json.data.length, 6)
  const s01 = semua.json.data.find((m: { id: string }) => m.id === 'S01')
  assert.equal(s01.tersedia, false)

  const lauk = await panggil('GET', '/menu?kategori=lauk')
  assert.equal(lauk.json.data.length, 4)
  assert.ok(lauk.json.data.every((m: { kategori: string }) => m.kategori === 'lauk'))
})

test('GET /menu: pencarian mengabaikan huruf besar-kecil dan tidak menafsirkan wildcard', async () => {
  const ayam = await panggil('GET', '/menu?q=AYAM')
  assert.deepEqual(ayam.json.data.map((m: { id: string }) => m.id), ['L05'])
  const persen = await panggil('GET', '/menu?q=%25')
  assert.equal(persen.json.data.length, 0)
})

test('GET /menu/:id: ada dan tidak ada', async () => {
  assert.equal((await panggil('GET', '/menu/L05')).json.data.nama, 'Ayam Goreng')
  assert.equal((await panggil('GET', '/menu/L99')).status, 404)
})

test('T-A1 replay: idPermintaan yang sama dibalas 200 dengan pesanan yang sama', async () => {
  const body = pesan([{ menuId: 'L05', jumlah: 1 }, { menuId: 'S07', jumlah: 1 }], 'Uji Replay')
  const pertama = await panggil('POST', '/pesanan', { body })
  assert.equal(pertama.status, 201)
  assert.equal(pertama.json.data.totalHarga, 14500)
  assert.match(pertama.json.data.id, /^BE-\d{4}$/)

  const ulang = await panggil('POST', '/pesanan', { body })
  assert.equal(ulang.status, 200)
  assert.equal(ulang.json.data.id, pertama.json.data.id)
})

test('T-A2 dua permintaan identik bersamaan: satu pesanan, satu 201 dan satu 200', async () => {
  const body = pesan([{ menuId: 'L01', jumlah: 2 }], 'Uji Balapan Pesan')
  const [a, b] = await Promise.all([
    panggil('POST', '/pesanan', { body }),
    panggil('POST', '/pesanan', { body }),
  ])
  assert.deepEqual([a.status, b.status].sort(), [200, 201])
  assert.equal(a.json.data.id, b.json.data.id)

  const daftar = await owner('GET', '/pesanan')
  const jumlah = daftar.json.data.filter((p: { nama: string }) => p.nama === 'Uji Balapan Pesan').length
  assert.equal(jumlah, 1)
})

test('T-A10 menuId tidak dikenal: 400 dengan rincian menunjuk items.N.menuId', async () => {
  const r = await panggil('POST', '/pesanan', { body: pesan([{ menuId: 'lauk-05', jumlah: 1 }]) })
  assert.equal(r.status, 400)
  assert.equal(r.json.galat.kode, 'MASUKAN_TIDAK_SAH')
  assert.equal(r.json.galat.rincian[0].field, 'items.0.menuId')
})

test('T-A11 menu habis: 400 MENU_HABIS dengan menuId yang habis', async () => {
  const r = await panggil('POST', '/pesanan', { body: pesan([{ menuId: 'S01', jumlah: 1 }]) })
  assert.equal(r.status, 400)
  assert.equal(r.json.galat.kode, 'MENU_HABIS')
  assert.equal(r.json.galat.rincian[0].menuId, 'S01')
})

test('T-A12 harga berubah: 409 HARGA_BERUBAH dan pesanan tidak tersimpan', async () => {
  const nama = 'Uji Harga Berubah'
  const r = await panggil('POST', '/pesanan', {
    body: pesan([{ menuId: 'L05', jumlah: 1, hargaDiharapkan: 9000 }], nama),
  })
  assert.equal(r.status, 409)
  assert.equal(r.json.galat.kode, 'HARGA_BERUBAH')
  assert.equal(r.json.galat.rincian[0].hargaTerkini, 9500)

  const daftar = await owner('GET', '/pesanan')
  assert.equal(daftar.json.data.filter((p: { nama: string }) => p.nama === nama).length, 0)
})

test('masukan salah: jumlah 0 dan nomor meja tidak sah ditolak dengan rincian', async () => {
  const jumlah = await panggil('POST', '/pesanan', { body: pesan([{ menuId: 'L05', jumlah: 0 }]) })
  assert.equal(jumlah.status, 400)
  assert.equal(jumlah.json.galat.rincian[0].field, 'items.0.jumlah')

  const meja = await panggil('POST', '/pesanan', {
    body: pesan([{ menuId: 'L05', jumlah: 1 }], 'Uji Meja', { nomorMeja: 'A 9!' }),
  })
  assert.equal(meja.status, 400)
  assert.equal(meja.json.galat.rincian[0].field, 'nomorMeja')
})

test('endpoint pemilik menolak tanpa token dan dengan token salah', async () => {
  for (const token of [null, 'token-salah-sama-sekali']) {
    const r = await panggil('GET', '/pesanan', { token })
    assert.equal(r.status, 401)
    assert.equal(r.json.galat.kode, 'TANPA_HAK')
  }
  const tulis = await panggil('PATCH', '/menu/L05', { body: { tersedia: false } })
  assert.equal(tulis.status, 401)
})

test('GET /pesanan (pemilik): filter pembayaran dibayar hanya menampilkan pesanan dibayar', async () => {
  const r = await owner('GET', '/pesanan?pembayaran=dibayar')
  assert.equal(r.status, 200)
  const nama = r.json.data.map((p: { nama: string }) => p.nama)
  assert.ok(nama.includes('Toni') && nama.includes('Sari'))
  assert.ok(!nama.includes('Budi'))
  assert.ok(r.json.data.every((p: { pembayaran: string }) => p.pembayaran === 'dibayar'))
})

test('GET /pesanan/:id (pemilik): detail memuat item dan nama pelanggan', async () => {
  const toni = await cariPesananOwner('Toni')
  const r = await owner('GET', `/pesanan/${toni.id}`)
  assert.equal(r.status, 200)
  assert.equal(r.json.data.items.length, 2)
  assert.equal(r.json.data.nama, 'Toni')
})

test('status: transisi sah, idempoten, dan transisi tidak sah ditolak', async () => {
  const p = await buatPesanan('Uji Status')
  assert.equal((await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'diproses' })).status, 200)
  assert.equal((await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'diproses' })).status, 200)

  const mundur = await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'masuk' })
  assert.equal(mundur.status, 409)
  assert.equal(mundur.json.galat.kode, 'KONFLIK')

  assert.equal((await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'selesai' })).status, 200)
  const dariSelesai = await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'batal' })
  assert.equal(dariSelesai.status, 409)
})

test('T-A6 batal saat sudah dibayar: 409 dengan pesan yang menjelaskan langkahnya', async () => {
  const p = await buatPesanan('Uji Batal Bayar')
  assert.equal((await owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'dibayar' })).status, 200)

  const batal = await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'batal' })
  assert.equal(batal.status, 409)
  assert.match(batal.json.galat.pesan, /Ubah pembayaran ke 'belum' dulu/)

  assert.equal((await owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'belum' })).status, 200)
  assert.equal((await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'batal' })).status, 200)
})

test('T-A8 pembayaran idempoten: dibayar dua kali tidak mengubah dibayarPada', async () => {
  const p = await buatPesanan('Uji Bayar Ganda')
  const pertama = await owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'dibayar' })
  const kedua = await owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'dibayar' })
  assert.equal(kedua.status, 200)
  assert.equal(kedua.json.data.dibayarPada, pertama.json.data.dibayarPada)
  assert.notEqual(pertama.json.data.dibayarPada, null)
})

test('pesanan batal tidak bisa ditandai dibayar', async () => {
  const p = await buatPesanan('Uji Batal Lalu Bayar')
  assert.equal((await owner('PATCH', `/pesanan/${p.id}/status`, { status: 'batal' })).status, 200)
  const bayar = await owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'dibayar' })
  assert.equal(bayar.status, 409)
})

test('T-A7 balapan batal vs bayar: tidak pernah batal dan dibayar bersamaan', async () => {
  const p = await buatPesanan('Uji Balapan Batal Bayar')
  const [batal, bayar] = await Promise.all([
    owner('PATCH', `/pesanan/${p.id}/status`, { status: 'batal' }),
    owner('PATCH', `/pesanan/${p.id}/pembayaran`, { pembayaran: 'dibayar' }),
  ])
  assert.ok(batal.status === 200 || bayar.status === 200, 'salah satu harus berhasil')

  const akhir = await owner('GET', `/pesanan/${p.id}`)
  const { status, pembayaran } = akhir.json.data
  assert.ok(!(status === 'batal' && pembayaran === 'dibayar'), `keadaan tidak konsisten: ${status}/${pembayaran}`)
})

test('pengeluaran: nominal nol dan tanggal masa depan ditolak; yang sah tersimpan', async () => {
  const nol = await owner('POST', '/pengeluaran', { keterangan: 'Uji nol', nominal: 0, tanggal: '2026-11-27' })
  assert.equal(nol.status, 400)
  assert.equal(nol.json.galat.rincian[0].field, 'nominal')

  const masaDepan = await owner('POST', '/pengeluaran', { keterangan: 'Uji depan', nominal: 1000, tanggal: '2099-01-01' })
  assert.equal(masaDepan.status, 400)
  assert.equal(masaDepan.json.galat.rincian[0].field, 'tanggal')

  const sah = await owner('POST', '/pengeluaran', { keterangan: 'Uji pengeluaran', nominal: 150000, tanggal: '2026-11-27' })
  assert.equal(sah.status, 201)
  assert.equal(sah.json.data.nominal, 150000)

  const daftar = await owner('GET', '/pengeluaran?dari=2026-11-01&sampai=2026-11-30')
  assert.ok(daftar.json.data.some((x: { keterangan: string }) => x.keterangan === 'Uji pengeluaran'))
})

test('T-rekap: Desember 2026 cocok dengan skenario plan (22.000 − 5.000 = 17.000)', async () => {
  const r = await owner('GET', '/rekap?dari=2026-12-01&sampai=2026-12-31')
  assert.equal(r.status, 200)
  assert.deepEqual(
    {
      pemasukan: r.json.data.pemasukan,
      pengeluaran: r.json.data.pengeluaran,
      saldoArusKas: r.json.data.saldoArusKas,
      jumlahPesananDibayar: r.json.data.jumlahPesananDibayar,
      jumlahPesananMasuk: r.json.data.jumlahPesananMasuk,
    },
    { pemasukan: 22000, pengeluaran: 5000, saldoArusKas: 17000, jumlahPesananDibayar: 2, jumlahPesananMasuk: 3 },
  )
})

test('rekap: periode tanpa transaksi bernilai nol; dari setelah sampai ditolak', async () => {
  const kosong = await owner('GET', '/rekap?dari=2001-01-01&sampai=2001-01-31')
  assert.equal(kosong.json.data.pemasukan, 0)
  assert.equal(kosong.json.data.saldoArusKas, 0)

  const terbalik = await owner('GET', '/rekap?dari=2026-12-31&sampai=2026-12-01')
  assert.equal(terbalik.status, 400)
})

test('menu (pemilik): tambah membuat id L/S berikutnya; kategori tidak bisa diubah', async () => {
  const lauk = await owner('POST', '/menu', {
    nama: 'Uji Lauk', kategori: 'lauk', harga: 3000, foto: 'uji.jpg',
  })
  assert.equal(lauk.status, 201)
  assert.equal(lauk.json.data.id, 'L11')

  const sayur = await owner('POST', '/menu', {
    nama: 'Uji Sayur', kategori: 'sayur', harga: 4000, foto: 'uji.jpg',
  })
  assert.equal(sayur.json.data.id, 'S08')

  const ubah = await owner('PATCH', '/menu/L11', { tersedia: false, harga: 3500 })
  assert.equal(ubah.status, 200)
  assert.equal(ubah.json.data.tersedia, false)
  assert.equal(ubah.json.data.harga, 3500)

  const kategori = await owner('PATCH', '/menu/L11', { kategori: 'sayur' })
  assert.equal(kategori.status, 400)

  assert.equal((await owner('PATCH', '/menu/L99', { tersedia: true })).status, 404)
})

test('menu (pemilik): masukan salah ditolak dengan rincian', async () => {
  const r = await owner('POST', '/menu', { nama: 'X', kategori: 'lauk', harga: -1 })
  assert.equal(r.status, 400)
  const fields = r.json.galat.rincian.map((x: { field: string }) => x.field)
  assert.ok(fields.includes('nama') && fields.includes('harga') && fields.includes('foto'))
})
