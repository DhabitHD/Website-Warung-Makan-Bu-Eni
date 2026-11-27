import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dariGalatDb } from '../src/lib/galat'
import { tanggalWibHariIni } from '../src/lib/waktu'
import { menuUbah, uraikan, rekapQuery } from '../src/lib/skema'
import { GalatApi } from '../src/lib/galat'

test('CHECK violation 23514 dipetakan ke 409 KONFLIK', () => {
  const galat = dariGalatDb({ code: '23514' })
  assert.ok(galat instanceof GalatApi)
  assert.equal(galat.status, 409)
  assert.equal(galat.kode, 'KONFLIK')
})

test('unique violation 23505 dipetakan ke 409 KONFLIK', () => {
  assert.equal(dariGalatDb({ code: '23505' })?.kode, 'KONFLIK')
})

test('galat database lain tidak dipetakan', () => {
  assert.equal(dariGalatDb({ code: '42P01' }), undefined)
  assert.equal(dariGalatDb(new Error('x')), undefined)
})

test('tanggal WIB hari ini berformat YYYY-MM-DD', () => {
  assert.match(tanggalWibHariIni(), /^\d{4}-\d{2}-\d{2}$/)
})

test('kategori menu tidak bisa diubah lewat PATCH', () => {
  assert.throws(() => uraikan(menuUbah, { kategori: 'sayur' }), (error: unknown) => {
    return error instanceof GalatApi && error.kode === 'MASUKAN_TIDAK_SAH'
  })
})

test('rekap menolak dari setelah sampai', () => {
  assert.throws(() => uraikan(rekapQuery, { dari: '2026-12-31', sampai: '2026-12-01' }), GalatApi)
})
