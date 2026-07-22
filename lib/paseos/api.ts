import { createClient } from '@/lib/supabase/client'
import { ensureAnonSession } from './auth'
import { computeVerification } from './geo'
import type { Booking, BookingStatus, RoutePoint } from './types'

interface WalkBookingRow {
  id: string
  owner_id: string
  walker_id: string | null
  dog_name: string
  dog_breed: string | null
  walker_name: string
  scheduled_at: string
  expected_minutes: number
  price_clp: number | null
  status: BookingStatus
  started_at: string | null
  ended_at: string | null
  start_photo_url: string | null
  end_photo_url: string | null
  route: RoutePoint[]
  is_demo: boolean
  created_at: string
}

function rowToBooking(row: WalkBookingRow): Booking {
  const session = {
    startedAt: row.started_at ? new Date(row.started_at).getTime() : null,
    endedAt: row.ended_at ? new Date(row.ended_at).getTime() : null,
    startPhoto: row.start_photo_url,
    endPhoto: row.end_photo_url,
    route: row.route ?? [],
    verification: null as Booking['session']['verification'],
  }
  if (row.status === 'completado') {
    session.verification = computeVerification({ expectedMinutes: row.expected_minutes, session })
  }
  return {
    id: row.id,
    dogName: row.dog_name,
    dogBreed: row.dog_breed,
    walkerName: row.walker_name,
    scheduledAt: row.scheduled_at,
    expectedMinutes: row.expected_minutes,
    priceClp: row.price_clp,
    status: row.status,
    createdAt: row.created_at,
    isDemo: row.is_demo,
    session,
  }
}

async function uploadPhoto(bookingId: string, kind: 'start' | 'end', file: File) {
  const supabase = createClient()
  const path = `${bookingId}/${kind}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('paseos').upload(path, file, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  return supabase.storage.from('paseos').getPublicUrl(path).data.publicUrl
}

export async function createBooking(input: {
  dogName: string
  dogBreed: string | null
  walkerName: string
  scheduledAt: string
  expectedMinutes: number
  priceClp: number | null
}) {
  const supabase = createClient()
  const user = await ensureAnonSession(supabase)
  const { data, error } = await supabase
    .from('walk_bookings')
    .insert({
      owner_id: user.id,
      dog_name: input.dogName,
      dog_breed: input.dogBreed,
      walker_name: input.walkerName,
      scheduled_at: input.scheduledAt,
      expected_minutes: input.expectedMinutes,
      price_clp: input.priceClp,
    })
    .select()
    .single<WalkBookingRow>()
  if (error) throw error
  return data.id
}

/** Trae un paseo por id — funciona tanto si eres owner/walker como si aún no lo eres (link compartido). */
export async function getBooking(id: string): Promise<Booking | null> {
  const supabase = createClient()
  await ensureAnonSession(supabase)
  const { data, error } = await supabase.rpc('get_shared_booking', { p_id: id })
  if (error) throw error
  const row = (data as WalkBookingRow[] | null)?.[0]
  return row ? rowToBooking(row) : null
}

export async function listMyBookings(): Promise<Booking[]> {
  const supabase = createClient()
  const user = await ensureAnonSession(supabase)
  const { data, error } = await supabase
    .from('walk_bookings')
    .select('*')
    .or(`owner_id.eq.${user.id},walker_id.eq.${user.id}`)
    .order('created_at', { ascending: false })
    .returns<WalkBookingRow[]>()
  if (error) throw error
  return (data ?? []).map(rowToBooking)
}

export async function cancelBooking(id: string) {
  const supabase = createClient()
  await ensureAnonSession(supabase)
  const { error } = await supabase.from('walk_bookings').update({ status: 'cancelado' }).eq('id', id)
  if (error) throw error
}

/** Reclama el paseo de forma atómica — falla si otro paseador ya lo tomó. */
export async function claimBooking(id: string, startPhotoFile: File): Promise<Booking> {
  const supabase = createClient()
  await ensureAnonSession(supabase)
  const startPhotoUrl = await uploadPhoto(id, 'start', startPhotoFile)
  const { data, error } = await supabase.rpc('claim_booking', { p_id: id, p_start_photo_url: startPhotoUrl })
  if (error) throw error
  const row = (data as WalkBookingRow[] | null)?.[0]
  if (!row) throw new Error('Este paseo ya no está disponible — puede que otro paseador ya lo haya tomado.')
  return rowToBooking(row)
}

export async function addRoutePoint(id: string, route: RoutePoint[]) {
  const supabase = createClient()
  const { error } = await supabase.from('walk_bookings').update({ route }).eq('id', id)
  if (error) throw error
}

export async function endWalk(id: string, endPhotoFile: File) {
  const supabase = createClient()
  await ensureAnonSession(supabase)
  const endPhotoUrl = await uploadPhoto(id, 'end', endPhotoFile)
  const { error } = await supabase
    .from('walk_bookings')
    .update({ status: 'completado', ended_at: new Date().toISOString(), end_photo_url: endPhotoUrl })
    .eq('id', id)
  if (error) throw error
}

const DEMO_PHOTO = (label: string) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#2a2a30"/><text x="50%" y="50%" fill="#8e8e96" font-family="sans-serif" font-size="20" text-anchor="middle">${label}</text></svg>`
  )

export async function seedDemo(kind: 'verificado' | 'revisar'): Promise<string> {
  const supabase = createClient()
  const user = await ensureAnonSession(supabase)
  const expectedMinutes = 30
  const now = Date.now()
  const actualMinutes = kind === 'verificado' ? 31 : 14
  const startedAt = now - actualMinutes * 60_000

  const { generateDemoRoute } = await import('./geo')
  const route =
    kind === 'verificado'
      ? generateDemoRoute({ lat: -33.4245, lng: -70.614 }, startedAt, actualMinutes)
      : generateDemoRoute({ lat: -33.4245, lng: -70.614 }, startedAt, actualMinutes).slice(0, 6)

  const { data, error } = await supabase
    .from('walk_bookings')
    .insert({
      owner_id: user.id,
      walker_id: user.id,
      dog_name: kind === 'verificado' ? 'Toby' : 'Luna',
      dog_breed: kind === 'verificado' ? 'Golden Retriever' : 'Mestizo',
      walker_name: kind === 'verificado' ? 'Camila R.' : 'Pedro M.',
      scheduled_at: new Date(startedAt).toISOString(),
      expected_minutes: expectedMinutes,
      price_clp: 8000,
      status: 'completado',
      started_at: new Date(startedAt).toISOString(),
      ended_at: new Date(now).toISOString(),
      start_photo_url: DEMO_PHOTO('Foto de inicio (demo)'),
      end_photo_url: DEMO_PHOTO('Foto de término (demo)'),
      route,
      is_demo: true,
    })
    .select()
    .single<WalkBookingRow>()
  if (error) throw error
  return data.id
}
