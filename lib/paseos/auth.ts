import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Cada dispositivo (dueño o paseador) necesita un auth.uid() estable para
 * que las políticas RLS de walk_bookings sepan quién es quién — sin pedir
 * registro. Usa sign-in anónimo de Supabase; la sesión persiste en este
 * navegador vía supabase-js, así que un dueño y un paseador en dos
 * celulares distintos terminan con dos auth.uid() distintos.
 *
 * Requiere "Allow anonymous sign-ins" habilitado en el proyecto de
 * Supabase (Authentication → Sign In / Providers).
 */
export async function ensureAnonSession(supabase: SupabaseClient) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (session?.user) return session.user

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error) {
    throw new Error(
      `No se pudo iniciar sesión anónima (¿está habilitada en el proyecto de Supabase?): ${error.message}`
    )
  }
  if (!data.user) throw new Error('No se pudo iniciar sesión anónima.')
  return data.user
}
