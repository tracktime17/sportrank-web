'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sr_compare'
const MAX_COMPARE = 3

let ids: string[] = []
let hydrated = false
const listeners = new Set<() => void>()

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) ids = JSON.parse(raw)
  } catch {
    // no-op
  }
  hydrated = true
}

function persist(next: string[]) {
  ids = next
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
  return ids
}

function getServerSnapshot() {
  return ids
}

/**
 * Igual que useFavorites: un store a nivel de módulo, no useState local.
 * Con muchas EventCard montadas a la vez, cada una necesita ver y escribir
 * la MISMA lista de comparación — si no, la última tarjeta en la que se
 * hace clic pisa lo que las demás agregaron.
 */
export function useCompare() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback((eventId: string) => {
    if (ids.includes(eventId)) {
      persist(ids.filter((id) => id !== eventId))
      return
    }
    // Igual que en el prototipo: al llegar a 3, el más antiguo sale
    // para dejar entrar al nuevo — nunca se bloquea silenciosamente.
    const next = ids.length >= MAX_COMPARE ? [...ids.slice(1), eventId] : [...ids, eventId]
    persist(next)
  }, [])

  const remove = useCallback((eventId: string) => persist(ids.filter((id) => id !== eventId)), [])
  const isCompared = useCallback((eventId: string) => snapshot.includes(eventId), [snapshot])

  return { ids: snapshot, hydrated, toggle, remove, isCompared, count: snapshot.length, max: MAX_COMPARE }
}
