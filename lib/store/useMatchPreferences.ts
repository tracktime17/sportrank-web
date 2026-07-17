'use client'

import { useCallback, useSyncExternalStore } from 'react'
import type { MatchPreferences } from '@/lib/events'

const STORAGE_KEY = 'sr_match_pref'

let pref: MatchPreferences | null = null
let hydrated = false
const listeners = new Set<() => void>()

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) pref = JSON.parse(raw)
  } catch {
    // localStorage no disponible (SSR/incógnito) — se queda sin preferencias
  }
  hydrated = true
}

function persist(next: MatchPreferences) {
  pref = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // no-op
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  ensureHydrated()
  return pref
}

function getServerSnapshot() {
  return pref
}

/**
 * Preferencias reales que el deportista respondió en el quiz de "Encuentra
 * tu match". Se guardan acá para que la ficha de evento pueda calcular un
 * Performance Score genuinamente personalizado (mismo computeMatch, mismos
 * datos) en vez de mostrar un número estático igual para todos.
 *
 * Store a nivel de módulo (no useState local): MatchConsole y
 * RealPerformancePanel pueden tener cada uno su propia instancia de este
 * hook montada al mismo tiempo, y ambas necesitan ver el mismo valor.
 */
export function useMatchPreferences() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const savePref = useCallback((next: MatchPreferences) => {
    persist(next)
  }, [])

  return { pref: snapshot, hydrated, savePref }
}
