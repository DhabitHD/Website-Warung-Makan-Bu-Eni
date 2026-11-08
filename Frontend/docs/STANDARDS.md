# Standar Frontend — Warung Makan Bu Eni

Dokumen ini adalah **sumber aturan** untuk tim frontend (Dhabit — Lead, Arya — Developer).
Baca sebelum menulis kode, dan jangan melanggar tanpa diskusi dulu.

---

## 1. Struktur folder (feature-based)

```text
src/
├── assets/                  # gambar, font
├── components/
│   ├── ui/                  # primitif shadcn/ui (Button, Input, ...) — MILIK LEAD
│   ├── layout/              # PageShell, SiteHeader, Container — MILIK LEAD
│   └── shared/              # komponen lintas fitur — MILIK LEAD
├── features/
│   ├── menu/                # components/ hooks/ services/
│   ├── cart/                # components/ store/
│   └── checkout/            # components/ schemas/ services/
├── pages/                   # satu file = satu halaman route
├── routes/                  # definisi React Router
├── services/                # API client global (Tahap 4)
├── types/                   # kontrak tipe data BERSAMA
└── lib/                     # utilitas murni (cn, currency)
```

**Aturan kepemilikan:**
- Arya hanya mengedit `features/cart/`, `features/checkout/`, `pages/CartPage.tsx`,
  `pages/CheckoutPage.tsx`, `pages/OrderSuccessPage.tsx`.
- Perubahan di `components/`, `types/`, `routes/`, `App.tsx` → **koordinasikan dengan Lead dulu**.

---

## 2. Penamaan

| Objek | Pola | Contoh |
|---|---|---|
| Komponen (file) | PascalCase | `MenuItemCard.tsx` |
| Komponen (ekspor) | PascalCase | `export function MenuItemCard()` |
| Hook | `use` + PascalCase | `useMenuFilter` |
| Store | `use` + `Cart` + `Store` | `useCartStore` |
| Fungsi utilitas | camelCase, kata kerja | `formatRupiah`, `hitungTotalHarga` |
| Tipe & interface | PascalCase | `MenuItem`, `CartItem` |
| Konstanta | SCREAMING_SNAKE | `MOCK_MENU`, `FILTERS` |
| Berkas fitur | kebab-case | `cart-store.ts`, `menu.mock.ts` |
| Variabel CSS/klas | ikuti Tailwind | `bg-brand`, `text-ink` |

---

## 3. Design system

Token ada di `src/index.css` (`@theme` + variabel `:root`). **Jangan pakai warna hex bebas.**

### Warna

| Token | Hex | Pemakaian |
|---|---|---|
| `background` | `#f5f0e6` | latar halaman (krem) |
| `surface` / `card` | `#fffdf9` | kartu, panel putih hangat |
| `ink` / `foreground` | `#22201b` | teks utama |
| `muted` | `#8b857a` | teks sekunder/redup |
| `border` | `#e4ded1` | garis pemisah |
| `brand` | `#2f4a3b` | hijau tua — chip aktif, judul merek |
| `accent` | `#b4552f` | rust — CTA utama, nomor section, italic hero |
| `placeholder` | `#ece7db` | area foto kosong |

### Tipografi

- **Display / judul:** `font-display` → **Fraunces** (otomatis untuk `h1–h3`).
- **Body:** `font-sans` → **Inter**.
- Skala: hero `text-5xl/6xl`, judul section `text-3xl/4xl`, judul kartu `text-base semibold`, harga `text-sm`, keterangan `text-xs`.

### Komponen siap pakai

| Komponen | Lokasi | Fungsi |
|---|---|---|
| `Button` | `components/ui/button.tsx` | varian: `default`, `accent` (rust), `outline`, `ghost` |
| `.btn-accent` | kelas global | tombol rust penuh (contoh: Lihat keranjang) |
| `.btn-outline` | kelas global | tombol outline lebar penuh (contoh: + Tambah) |
| `SectionHeading` | `components/shared/` | judul "01 / Lauk" + label jumlah |
| `CategoryChip` | `components/shared/` | filter Semua/Lauk/Sayur |
| `SearchInput` | `components/shared/` | input pencarian berikon |
| `StatCard` | `components/shared/` | kartu statistik hijau |
| `OrderSummaryCard` | `components/shared/` | panel "Pesananmu" |
| `EmptyState` | `components/shared/` | tampilan data kosong |

### Radius & bayangan

- Kartu: `rounded-xl` (0.75rem), bayangan `shadow-card`.
- Tombol & input: `rounded-lg`.
- Fokus: selalu sediakan `focus-visible:outline-2`.

---

## 4. Kontrak tipe data (jangan diubah sembarangan)

`src/types/menu.ts`

```ts
type KategoriMenu = 'lauk' | 'sayur'
type FilterKategori = KategoriMenu | 'semua'

interface MenuItem {
  id: string
  nama: string
  harga: number        // Rupiah, tanpa simbol
  kategori: KategoriMenu
  foto: string         // nama file, contoh: "tempegarit.jpg"
  deskripsi?: string
}
```

`src/types/cart.ts`

```ts
interface CartItem {
  itemId: string
  nama: string
  harga: number
  jumlah: number       // minimal 1
}
```

Format rupiah **selalu** lewat `formatRupiah()` / `formatRupiahFull()` di `src/lib/currency.ts`.

---

## 5. Store keranjang (Zustand)

`src/features/cart/store/cart-store.ts` — sudah berfungsi, Arya melanjutkan:

```ts
const items = useCartStore((s) => s.items)
const tambah = useCartStore((s) => s.tambah)        // tambah(menu: MenuItem)
const ubahJumlah = useCartStore((s) => s.ubahJumlah) // (itemId, jumlah)
const hapus = useCartStore((s) => s.hapus)          // (itemId)
const kosongkan = useCartStore((s) => s.kosongkan)
```

Selector total sudah tersedia: `hitungTotalJumlah(items)`, `hitungTotalHarga(items)`.

---

## 6. Aturan kode

1. **Satu file satu komponen** utama; komponen kecil boleh menempel bila hanya dipakai di situ.
2. Komponen **tidak boleh fetch data langsung** — data lewat hook (`use*`) atau service.
3. Semua ikon dari **lucide-react**, ukuran `size-4` / `size-5`.
4. Gunakan `cn()` untuk menggabungkan kelas Tailwind.
5. Aksesibilitas: tombol punya `aria-label` bila isinya hanya ikon; gambar/dekoratif `aria-hidden`.
6. Wajib lolos sebelum commit:
   ```bash
   npx tsc -b     # typecheck
   npm run build  # build produksi
   ```
7. Komponen harus **responsive**: mobile dulu, lalu tablet/desktop.

---

## 7. Git workflow

```text
main
  └── develop
        ├── feature/project-setup   (Dhabit)
        ├── feature/design-system   (Dhabit)
        ├── feature/menu-page       (Dhabit)
        ├── feature/menu-filter     (Dhabit)
        ├── feature/cart            (Arya)
        ├── feature/checkout        (Arya)
        └── feature/api-integration (bersama)
```

1. Tidak boleh push langsung ke `main`.
2. Satu fitur = satu branch = satu Pull Request.
3. Lead melakukan code review sebelum merge ke `develop`.
4. Pesan commit: `<type>: <keterangan>` — type: `feat`, `fix`, `style`, `refactor`, `docs`, `chore`.
   Contoh: `feat: tambah filter kategori pada halaman menu`.

---

## 8. Route

| Path | Halaman | Pemilik |
|---|---|---|
| `/` | redirect ke `/menu` | Lead |
| `/menu` | `MenuPage` | Lead |
| `/cart` | `CartPage` | Arya |
| `/checkout` | `CheckoutPage` | Arya |
| `/order-success` | `OrderSuccessPage` | Arya |

Nomor meja dibaca dari query: `/menu?table=A01`.
