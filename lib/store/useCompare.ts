'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sr_compare'
const MAX_COMPARE = 3

export function useCompare() {
  const [ids, setIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setIds(JSON.parse(raw))
    } catch {
      // no-op
    }
    setHydrated(true)
  }, [])

  const persist = useCallback((next: string[]) => {
    setIds(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // no-op
    }
  }, [])

  const toggle = useCallback(
    (eventId: string) => {
      if (ids.includes(eventId)) {
        persist(ids.filter((id) => id !== eventId))
        return
      }
      // Igual que en el prototipo: al llegar a 3, el más antiguo sale
      // para dejar entrar al nuevo — nunca se bloquea silenciosamente.
      const next = ids.length >= MAX_COMPARE ? [...ids.slice(1), eventId] : [...ids, eventId]
      persist(next)
    },
    [ids, persist]
  )

  const remove = useCallback((eventId: string) => persist(ids.filter((id) => id !== eventId)), [ids, persist])
  const isCompared = useCallback((eventId: string) => ids.includes(eventId), [ids])

  return { ids, hydrated, toggle, remove, isCompared, count: ids.length, max: MAX_COMPARE }
}
