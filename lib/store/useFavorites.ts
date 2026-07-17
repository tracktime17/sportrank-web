'use client'

import { useCallback, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'sr_favorites'

let ids: Set<string> = new Set()
let hydrated = false
const listeners = new Set<() => void>()

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) ids = new Set(JSON.parse(raw))
  } catch {
    // localStorage no disponible (SSR/incógnito) — se queda vacío
  }
  hydrated = true
}

function persist(next: Set<string>) {
  ids = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
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
 * Favoritos del lado del cliente. Hoy vive en localStorage porque todavía
 * no hay Auth conectado — en cuanto exista login, esto debería migrar a
 * la tabla `favorites` de Supabase (user_id + event_id), que ya tiene el
 * RLS correcto esperando. El hook expone la misma API para que ese cambio
 * no rompa los componentes que lo consumen.
 *
 * Usa un store a nivel de módulo (no useState local) porque hay muchas
 * instancias de este hook montadas a la vez — una por cada EventCard de
 * una grilla. Con useState local, cada tarjeta escribía su propia copia
 * del set a localStorage, y la última en escribir borraba lo que las
 * demás habían guardado. useSyncExternalStore comparte una sola fuente
 * de verdad entre todas las instancias.
 */
export function useFavorites() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = useCallback((eventId: string) => {
    const next = new Set(ids)
    if (next.has(eventId)) next.delete(eventId)
    else next.add(eventId)
    persist(next)
  }, [])

  const isFavorite = useCallback((eventId: string) => snapshot.has(eventId), [snapshot])

  return { ids: snapshot, hydrated, toggle, isFavorite, count: snapshot.size }
}
