'use client'

import { useCallback, useEffect, useState } from 'react'
import type { MatchPreferences } from '@/lib/events'

const STORAGE_KEY = 'sr_match_pref'

/**
 * Preferencias reales que el deportista respondió en el quiz de "Encuentra
 * tu match". Se guardan acá para que la ficha de evento pueda calcular un
 * Performance Score genuinamente personalizado (mismo computeMatch, mismos
 * datos) en vez de mostrar un número estático igual para todos.
 */
export function useMatchPreferences() {
  const [pref, setPrefState] = useState<MatchPreferences | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setPrefState(JSON.parse(raw))
    } catch {
      // localStorage no disponible (SSR/incógnito) — se queda sin preferencias
    }
    setHydrated(true)
  }, [])

  const savePref = useCallback((next: MatchPreferences) => {
    setPrefState(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // no-op
    }
  }, [])

  return { pref, hydrated, savePref }
}
