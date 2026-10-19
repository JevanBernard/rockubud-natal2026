import { db } from '@/lib/supabase'
import type { Event, Reg } from '@/lib/rekap'

export * from '@/lib/rekap'

export async function ambilData() {
  const sb = db()
  const { data: ev } = await sb.from('events').select('*').order('tanggal').limit(1).single()
  if (!ev) return null
  const { data } = await sb
    .from('registrations')
    .select('*, komsel(nama), peserta(id, nama, kelompok, gender, checked_in_at)')
    .eq('event_id', ev.id)
    .order('created_at', { ascending: false })
    .limit(5000)
  return { ev: ev as Event, regs: (data ?? []) as unknown as Reg[] }
}
