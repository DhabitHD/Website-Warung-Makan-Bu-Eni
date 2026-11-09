import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SesiAdmin } from '../services/auth.service'

export interface AuthState {
  /** Null bila belum login. */
  admin: SesiAdmin | null
  /** Simpan sesi setelah login berhasil. */
  masuk: (admin: SesiAdmin) => void
  /** Hapus sesi (tombol Keluar di dashboard). */
  keluar: () => void
}

/**
 * Sesi admin (Fase 2 — MILIK LEAD).
 * Disimpan di localStorage agar tetap login saat refresh;
 * auth asli (token API) menyusul pada Tahap 4.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      admin: null,
      masuk: (admin) => set({ admin }),
      keluar: () => set({ admin: null }),
    }),
    { name: 'warung.sesiAdmin' },
  ),
)
