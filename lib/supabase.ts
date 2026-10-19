import { createClient } from '@supabase/supabase-js'

// Hanya dipakai di server (server component / server action).
// Service role key tidak boleh sampai ke browser.
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Env Supabase belum diisi (lihat .env.example)')
  return createClient(url, key, { auth: { persistSession: false } })
}
