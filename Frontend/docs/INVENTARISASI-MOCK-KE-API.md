# Inventarisasi Mock → API — Warung Makan Bu Eni

Dokumen ini mencatat **semua titik yang harus diubah** saat data simulasi diganti API `/api/v1/`.
Disusun untuk memenuhi checklist Minggu 1 dan catatan §6 `PEMBAGIAN TUGAS TIM FS.md`.
Sumber kontrak: `Backend/docs/KONTRAK-API.md` versi 3 (cabang `feature/backend-setup`).

## 1. Prinsip

1. **Tanda tangan service tidak berubah.** Pemanggil (komponen/halaman) tidak boleh diedit saat swap.
   Fungsi di `features/checkout/services/order.service.ts` sudah dibuat sebagai titik ganti:
   cukup isi fungsi dengan pemanggilan API, hapus `setTimeout` dan akses store mock.
2. **Server yang berwenang.** Harga dan total dihitung server dari tabel `menu`; klien hanya
   mengirim `menuId` + `jumlah`. Validasi Zod klien hanya mempercepat umpan balik, bukan otoritas.
3. **Satu lapisan data per fitur.** Komponen tidak boleh fetch langsung — data lewat hook (`use*`)
   atau service, sesuai `STANDARDS.md` §6.2.

## 2. Peta titik swap

| No | Fungsi / data sekarang | Lokasi | Pengganti API | Keterangan |
|---|---|---|---|---|
| 1 | `MOCK_MENU` → `useMenuStore` | `features/menu/store/menu-store.ts`, `services/menu.mock.ts` | `GET /api/v1/menu` (publik), `GET /menu/:id` | Perlu service + hook TanStack Query. Semua menu dikirim termasuk yang habis. |
| 2 | Cari/filter menu di klien | `components/shared/SearchInput`, `CategoryChip` | `GET /menu?q=&kategori=` | Bila filter dipindah ke server, `q` dan `kategori` jadi query param. |
| 3 | `kirimPesanan(payload)` | `features/checkout/services/order.service.ts` | `POST /api/v1/pesanan` | Payload sudah sesuai kontrak. Respons `data` = `OrderResult`. Idempotensi lewat `idPermintaan`. |
| 4 | `ubahStatusPesanan(id, status)` | sama | `PATCH /api/v1/pesanan/:id/status` | Aturan transisi sudah sama dengan kontrak §2.2. Konflik → `409 KONFLIK`. |
| 5 | `ubahPembayaranPesanan(id, bayar)` | sama | `PATCH /api/v1/pesanan/:id/pembayaran` | `dibayar` → `dibayarPada` diisi server. |
| 6 | `useDaftarPesanan()` | `features/checkout/hooks/usePesanan.ts` | `GET /api/v1/pesanan` (pemilik) | Perlu token. Sortir terbaru bisa tetap di klien atau diganti server. |
| 7 | `usePesanan(id)` | sama | `GET /api/v1/pesanan/:id` (pemilik) | Versi publik (Lanjutan) hanya ringkas. |
| 8 | `useOrderStore` + `MOCK_PESANAN` | `features/checkout/store/order-store.ts`, `services/order.mock.ts` | API sebagai sumber data tunggal | Hapus persist localStorage `warung.pesanan.v1` setelah API aktif. |
| 9 | `simpanPesananTerakhir` / `bacaPesananTerakhir` | `order.service.ts` (sessionStorage `warung.pesananTerakhir`) | `GET /api/v1/pesanan/:id` publik (Lanjutan) | Sementara cukup dari respons `POST /pesanan`. |
| 10 | Validasi `checkoutSchema`, `orderPayloadSchema` | `features/checkout/schemas/` | Tetap di klien + Zod di server | Pesan galat klien dipetakan ke `galat.rincian` bila perlu. |
| 11 | Sesi `useAuthStore` (mock `admin/eni123`) | `features/auth/store/auth-store.ts` | `POST /api/v1/auth/login` | Token statis di Inti, login sungguhan di Lanjutan. `401 TANPA_HAK` → arahkan ke `/admin/login`. |
| 12 | Statistik dihitung lokal | `pages/admin/AdminOverviewPage.tsx`, `AdminHistoryPage.tsx` | `GET /api/v1/rekap`, `/rekap/menu-terlaris` | Logika Dasbor milik Galih & Thalib; Arya hanya integrasi tampilan. |
| 13 | Belum ada | — | `POST /api/v1/rekomendasi` | Halaman pembeli (form suasana hati/pedas/anggaran) belum dibuat. Rute perlu koordinasi dengan Lead. |
| 14 | Pengeluaran belum ada | — | `POST/GET /api/v1/pengeluaran` | Milik Dhabit; dasbor menampilkan hasilnya. |

## 3. Perubahan kontrak data yang perlu disepakati

Berdasarkan kontrak §1.4, field yang **berbeda** dengan kode frontend sekarang:

| Frontend sekarang | API | Dampak |
|---|---|---|
| `MenuItem.deskripsi` | `keteranganRasa` | Kartu menu dan form admin perlu dibaca ulang. |
| tidak ada | `MenuItem.porsi` | Wajib ada di plan; tambahkan ke tipe bersama setelah disepakati Arya + DS/AI. |
| `CartItem.itemId` | `menuId` | Sudah dipetakan di `kirimPesanan` menjadi `ItemPermintaan.menuId`. |
| `nomorMeja` wajib | `nomorMeja` opsional (`null`) | Tampilan sudah mendukung "Tanpa meja"; tipe payload bisa dilonggarkan saat swap. |

> `src/types/menu.ts` dan `src/types/cart.ts` adalah kontrak bersama — **jangan diubah tanpa koordinasi Lead**.

## 4. Format galat API

```jsonc
{
  "galat": {
    "kode": "MASUKAN_TIDAK_SAH",
    "pesan": "Ada isian yang belum benar.",
    "rincian": [{ "field": "items.0.jumlah", "pesan": "Jumlah minimal 1." }]
  }
}
```

Kode yang perlu ditangani UI: `MASUKAN_TIDAK_SAH`, `MENU_HABIS`, `HARGA_BERUBAH`,
`TANPA_HAK`, `TIDAK_DITEMUKAN`, `KONFLIK`, `SERVER`.
`HARGA_BERUBAH` perlu pesan khusus: harga di keranjang boleh diperbarui dari `rincian` sebelum kirim ulang.

## 5. Urutan swap yang disarankan

1. Pasang API client (base URL dari env, bukan hardcode) + pembacaan `galat`.
2. Swap `kirimPesanan`, `ubahStatusPesanan`, `ubahPembayaranPesanan` — tanda tangan sudah siap.
3. Swap `useDaftarPesanan` / `usePesanan` ke `GET /pesanan`, hapus store persist.
4. Swap katalog menu ke `GET /menu` (butuh keputusan field `porsi`/`keteranganRasa`).
5. Swap auth ke `POST /auth/login` + token.
6. Rekap & pengeluaran, lalu rekomendasi.

## 6. Yang sudah siap di frontend

- `OrderPayload` memakai `idPermintaan` dan `items: { menuId, jumlah }` sesuai kontrak §4.3.
- Harga dan total dihitung ulang dari katalog, bukan dipercaya dari keranjang.
- `orderPayloadSchema` (Zod) menolak keranjang kosong, `jumlah` bukan bulat, serta di luar 1–50.
- Aturan transisi status dan pembayaran sudah mengikuti kontrak §2.2–2.3.
- Semua pemanggilan data lewat hook/service, bukan fetch di komponen.

## 7. Masih perlu koordinasi

- Finalisasi `MenuItem.porsi` dan `keteranganRasa` (Arya + DS/AI, §6 dokumen pembagian tugas).
- Daftar final `suasanaHati` dari tim AI sebelum form rekomendasi dibuat.
- Penambahan rute halaman rekomendasi — `src/routes/` milik Lead.
- URL backend produksi dan mekanisme token untuk endpoint pemilik.
