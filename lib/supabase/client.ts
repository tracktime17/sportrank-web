import { createBrowserClient } from '@supabase/ssr'

// Cliente para usar en Client Components ('use client'):
// el motor de match (consola interactiva) vive en el navegador,
// así que este es el cliente que va a usar.
//
// Nota sobre tipos: en vez de pasarle el genérico completo <Database> al
// cliente (frágil entre versiones de supabase-js/postgrest-js, cuyos tipos
// internos cambian con frecuencia), cada consulta se tipa puntualmente con
// `.returns<T>()` — ver lib/events.ts. Es más simple y no se rompe solo
// porque una dependencia subió de versión.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
