/** Data admin demo — Tahap 4 mengganti fungsi ini dengan POST /auth/login. */
const KREDENSIAL_DEMO = {
  username: 'admin',
  password: 'eni123',
}

export interface SesiAdmin {
  username: string
  nama: string
}

const JEDA_LOGIN_MS = 400

/**
 * Simulasi login pemilik warung.
 * Ganti dengan pemanggilan API sungguhan pada Tahap 4 tanpa mengubah
 * pemanggilnya (AdminLoginPage).
 */
export async function loginAdmin(username: string, password: string): Promise<SesiAdmin> {
  await new Promise((resolve) => setTimeout(resolve, JEDA_LOGIN_MS))

  const cocok =
    username.trim().toLowerCase() === KREDENSIAL_DEMO.username &&
    password === KREDENSIAL_DEMO.password

  if (!cocok) {
    throw new Error('Username atau password salah. Coba periksa lagi.')
  }

  return { username: KREDENSIAL_DEMO.username, nama: 'Bu Eni' }
}
