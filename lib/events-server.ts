import { createClient as createServerSupabase } from '@/lib/supabase/server'
import type { Discipline, EventRow } from '@/lib/supabase/types'

// Este archivo es SOLO para Server Components. Usa next/headers (vía el
// cliente de servidor de Supabase), así que nunca debe importarse desde un
// componente de cliente ('use client') ni desde lib/events.ts (que sí se
// importa desde componentes de cliente como EventCard o MatchConsole).

/** Trae todos los eventos publicados, opcionalmente filtrados por disciplina. */
export async function getEvents(discipline?: Discipline) {
  const supabase = await createServerSupabase()
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
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
    .returns<EventRow[]>()
    .single()

  if (error) throw error
  return data
}
