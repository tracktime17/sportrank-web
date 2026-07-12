import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieToSet = { name: string; value: string; options?: Parameters<Awaited<ReturnType<typeof cookies>>['set']>[2] }

// Cliente para usar en Server Components, Server Actions y Route Handlers.
// Es el que vas a usar para el listado de Explorar, el Detalle de un evento,
// y cualquier página que pueda renderizarse en el servidor (mejor SEO,
// carga inicial más rápida).
//
// Ver la nota en client.ts sobre por qué no se tipa con el genérico
// <Database> completo — se tipa cada consulta con `.returns<T>()`.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Se puede ignorar si un Server Component intenta escribir cookies;
            // el proxy.ts se encarga de refrescar la sesión.
          }
        },
      },
    }
  )
}
