import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { Discipline, EventRow } from '@/lib/supabase/types'

// Este archivo es SOLO para Server Components. Usa next/headers (vía el
// cliente de servidor de Supabase), así que nunca debe importarse desde un
// componente de cliente ('use client') ni desde lib/events.ts (que sí se
// importa desde componentes de cliente como EventCard o MatchConsole).

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Trae todos los eventos publicados y que todavía no ocurren, opcionalmente
 * filtrados por disciplina. El filtro de fecha es automático: así una
 * carrera no necesita despublicarse a mano el día que pasa — deja de
 * aparecer sola, sin que el equipo tenga que acordarse de mantener esto.
 */
export async function getEvents(discipline?: Discipline) {
  const supabase = await createServerSupabase()
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('event_date', todayIso())
    .order('event_date', { ascending: true })

  if (discipline) query = query.eq('discipline', discipline)

  const { data, error } = await query.returns<EventRow[]>()
  if (error) throw error
  return data
}

/** Trae un evento por su slug (para la pantalla de Detalle). */
export async function getEventBySlug(slug: string) {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .gte('event_date', todayIso())
    .returns<EventRow[]>()
    .single()

  if (error) throw error
  return data
}
