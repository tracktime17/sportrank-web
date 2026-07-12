'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sr_favorites'

/**
 * Favoritos del lado del cliente. Hoy vive en localStorage porque todavía
 * no hay Auth conectado — en cuanto exista login, esto debería migrar a
 * la tabla `favorites` de Supabase (user_id + event_id), que ya tiene el
 * RLS correcto esperando. El hook expone la misma API para que ese cambio
 * no rompa los componentes que lo consumen.
 */
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setIds(new Set(JSON.parse(raw)))
    } catch {
      // localStorage no disponible (SSR/incógnito) — se queda vacío
    }
    setHydrated(true)
  }, [])

  const persist = useCallback((next: Set<string>) => {
    setIds(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
    } catch {
      // no-op
    }
  }, [])

  const toggle = useCallback(
    (eventId: string) => {
      const next = new Set(ids)
      next.has(eventId) ? next.delete(eventId) : next.add(eventId)
      persist(next)
    },
    [ids, persist]
  )

  const isFavorite = useCallback((eventId: string) => ids.has(eventId), [ids])

  return { ids, hydrated, toggle, isFavorite, count: ids.size }
}
