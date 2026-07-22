'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { computeVerification, generateDemoRoute } from './geo'
import { emptySession, type Booking, type RoutePoint } from './types'

const STORAGE_KEY = 'huella_bookings_v1'

let bookings: Booking[] = []
let hydrated = false
const listeners = new Set<() => void>()

function ensureHydrated() {
  if (hydrated || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) bookings = JSON.parse(raw)
  } catch {
    // localStorage no disponible (SSR/incógnito) — se queda vacío
  }
  hydrated = true
}

function persist(next: Booking[]) {
  bookings = next
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
  return bookings
}

function getServerSnapshot() {
  return bookings
}

function update(id: string, fn: (booking: Booking) => Booking) {
  persist(bookings.map((b) => (b.id === id ? fn(b) : b)))
}

/**
 * Persistencia del lado del cliente para el prototipo de paseos (Huella).
 * Vive en localStorage porque todavía no hay backend/auth conectado para
 * este flujo — ver supabase/paseos_schema.sql para el esquema pensado
 * cuando esto pase a producción con paseadores y dueños reales.
 */
export function usePaseoStore() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const createBooking = useCallback(
    (input: {
      dogName: string
      dogBreed: string | null
      walkerName: string
      scheduledAt: string
      expectedMinutes: number
      priceClp: number | null
    }) => {
      const booking: Booking = {
        id: crypto.randomUUID(),
        ...input,
        status: 'pendiente',
        createdAt: new Date().toISOString(),
        session: emptySession(),
      }
      persist([booking, ...bookings])
      return booking.id
    },
    []
  )

  const cancelBooking = useCallback((id: string) => {
    update(id, (b) => ({ ...b, status: 'cancelado' }))
  }, [])

  const startWalk = useCallback((id: string, startPhoto: string) => {
    update(id, (b) => ({
      ...b,
      status: 'en_curso',
      session: { ...emptySession(), startedAt: Date.now(), startPhoto },
    }))
  }, [])

  const addRoutePoint = useCallback((id: string, point: RoutePoint) => {
    update(id, (b) => ({ ...b, session: { ...b.session, route: [...b.session.route, point] } }))
  }, [])

  const endWalk = useCallback((id: string, endPhoto: string) => {
    update(id, (b) => {
      const session = { ...b.session, endedAt: Date.now(), endPhoto }
      const verification = computeVerification({ expectedMinutes: b.expectedMinutes, session })
      return { ...b, status: 'completado', session: { ...session, verification } }
    })
  }, [])

  const seedDemo = useCallback((kind: 'verificado' | 'revisar') => {
    const expectedMinutes = 30
    const now = Date.now()
    const actualMinutes = kind === 'verificado' ? 31 : 14
    const startedAt = now - actualMinutes * 60_000
    const route: RoutePoint[] =
      kind === 'verificado'
        ? generateDemoRoute({ lat: -33.4245, lng: -70.614 }, startedAt, actualMinutes)
        : generateDemoRoute({ lat: -33.4245, lng: -70.614 }, startedAt, actualMinutes).slice(0, 6)

    const session = {
      ...emptySession(),
      startedAt,
      endedAt: now,
      startPhoto:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%232a2a30"/><text x="50%" y="50%" fill="%238e8e96" font-family="sans-serif" font-size="20" text-anchor="middle">Foto de inicio (demo)</text></svg>'
        ),
      endPhoto:
        'data:image/svg+xml;utf8,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="%232a2a30"/><text x="50%" y="50%" fill="%238e8e96" font-family="sans-serif" font-size="20" text-anchor="middle">Foto de término (demo)</text></svg>'
        ),
      route,
    }
    const verification = computeVerification({ expectedMinutes, session })

    const booking: Booking = {
      id: crypto.randomUUID(),
      dogName: kind === 'verificado' ? 'Toby' : 'Luna',
      dogBreed: kind === 'verificado' ? 'Golden Retriever' : 'Mestizo',
      walkerName: kind === 'verificado' ? 'Camila R.' : 'Pedro M.',
      scheduledAt: new Date(startedAt).toISOString(),
      expectedMinutes,
      priceClp: 8000,
      status: 'completado',
      createdAt: new Date(startedAt).toISOString(),
      session: { ...session, verification },
      isDemo: true,
    }
    persist([booking, ...bookings])
    return booking.id
  }, [])

  const getBooking = useCallback((id: string) => snapshot.find((b) => b.id === id) ?? null, [snapshot])

  return { bookings: snapshot, hydrated, createBooking, cancelBooking, startWalk, addRoutePoint, endWalk, seedDemo, getBooking }
}
