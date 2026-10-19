import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// Satu kata sandi bersama untuk admin (env ADMIN_PASSWORD).
// Cookie berisi HMAC dari kata sandi, jadi mengganti kata sandi otomatis
// mengeluarkan semua sesi lama. Hanya dipakai di server.

export const COOKIE_ADMIN = 'admin_session'
export const MASA_SESI_DETIK = 60 * 60 * 12

export function tokenSesi(): string | null {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return null
  return createHmac('sha256', pw).update('natal-admin-v1').digest('hex')
}

export function passwordBenar(input: string): boolean {
  const pw = process.env.ADMIN_PASSWORD
  if (!pw) return false
  // Hash dulu agar panjang sama dan perbandingan konstan-waktu
  const h = (s: string) => createHmac('sha256', 'cmp').update(s).digest()
  return timingSafeEqual(h(input), h(pw))
}

export async function adaAdmin(): Promise<boolean> {
  const t = tokenSesi()
  if (!t) return false
  const c = (await cookies()).get(COOKIE_ADMIN)?.value
  if (!c || c.length !== t.length) return false
  return timingSafeEqual(Buffer.from(c), Buffer.from(t))
}

export async function wajibAdmin() {
  if (!(await adaAdmin())) redirect('/admin/login')
}
