'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { usePaseoStore } from '@/lib/paseos/store'
import { PaseoMapLoader } from '@/components/paseos/PaseoMapLoader'
import { fmtDistance, fmtMinutes, totalDistanceMeters } from '@/lib/paseos/geo'
import type { RoutePoint } from '@/lib/paseos/types'

function readPhotoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Ignora puntos claramente ruidosos: precisión muy mala, o saltos tan chicos
// que son solo jitter del GPS estando quieto.
const MIN_ACCURACY_M = 80
const MIN_MOVE_M = 4

export default function CaminarPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { hydrated, getBooking, startWalk, addRoutePoint, endWalk } = usePaseoStore()

  const [elapsedS, setElapsedS] = useState(0)
  const [geoError, setGeoError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<RoutePoint | null>(null)

  const booking = hydrated ? getBooking(params.id) : null
  // El estado "en curso"/"por iniciar" vive en el booking mismo (localStorage
  // vía usePaseoStore) — no se duplica en un useState local, así que un
  // refresco de página en medio del paseo no pierde el estado.
  const phase = booking?.status === 'en_curso' ? 'during' : 'before'
  const route = booking?.session.route ?? []
  const startedAt = booking?.session.startedAt ?? null
  const geoSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  function beginTracking() {
    if (watchIdRef.current !== null || !navigator.geolocation) return
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGeoError(null)
        const point: RoutePoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: Date.now(),
          accuracy: pos.coords.accuracy,
        }
        if (point.accuracy !== null && point.accuracy > MIN_ACCURACY_M) return

        const last = lastPointRef.current
        if (last && totalDistanceMeters([last, point]) < MIN_MOVE_M) return

        lastPointRef.current = point
        addRoutePoint(params.id, point)
      },
      (err) => setGeoError(err.message || 'No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 }
    )
  }

  // Si la página se recarga con el paseo ya en curso, retoma el tracking.
  useEffect(() => {
    if (phase === 'during' && geoSupported) beginTracking()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, geoSupported])

  useEffect(() => {
    if (phase !== 'during' || !startedAt) return
    const interval = setInterval(() => setElapsedS(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [phase, startedAt])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  // Si ya está completado (ej. se visita este link después de terminar el
  // paseo), no hay nada que registrar — vuelve al reporte.
  useEffect(() => {
    if (booking?.status === 'completado') router.replace(`/paseos/${params.id}`)
  }, [booking?.status, params.id, router])

  async function handleStartPhoto(file: File) {
    const dataUrl = await readPhotoAsDataUrl(file)
    startWalk(params.id, dataUrl)
  }

  async function handleEndPhoto(file: File) {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    const dataUrl = await readPhotoAsDataUrl(file)
    endWalk(params.id, dataUrl)
    router.push(`/paseos/${params.id}`)
  }

  if (!hydrated) return null

  if (!booking) {
    return (
      <div className="wrap view-enter" style={{ paddingTop: 44 }}>
        <div className="empty-state">
          <h2>No encontramos este paseo</h2>
          <Link href="/paseos" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Volver a Huella
          </Link>
        </div>
      </div>
    )
  }

  if (booking.status === 'completado') return null

  const distanceM = totalDistanceMeters(route)

  return (
    <div className="wrap view-enter" style={{ paddingTop: 44, maxWidth: 560 }}>
      <div className="page-head" style={{ paddingBottom: 16 }}>
        <div className="eyebrow">Registro en vivo</div>
        <h1>Paseo de {booking.dogName}</h1>
        <p>
          {booking.expectedMinutes} min acordados con {booking.walkerName}.
        </p>
      </div>

      {!geoSupported && <div className="paseo-flag paseo-flag-bad">Este navegador no soporta geolocalización.</div>}
      {geoError && <div className="paseo-flag paseo-flag-bad">{geoError}</div>}

      {phase === 'before' && (
        <div className="paseo-panel">
          <h3>Paso 1 — Foto de inicio</h3>
          <p>Toma una foto del perro justo antes de comenzar. Al confirmar, empezamos a registrar la ruta GPS.</p>
          <label className="btn btn-primary" style={{ marginTop: 16, cursor: 'pointer', justifyContent: 'center' }}>
            Tomar foto y comenzar
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleStartPhoto(e.target.files[0])}
            />
          </label>
        </div>
      )}

      {phase === 'during' && (
        <>
          <div className="paseo-live-stats">
            <div className="paseo-stat">
              <div className="v">{fmtMinutes(elapsedS / 60)}</div>
              <div className="l">Tiempo transcurrido</div>
            </div>
            <div className="paseo-stat">
              <div className="v">{fmtDistance(distanceM)}</div>
              <div className="l">Distancia recorrida</div>
            </div>
            <div className="paseo-stat">
              <div className="v">{route.length}</div>
              <div className="l">Puntos GPS</div>
            </div>
          </div>

          <div className="paseo-map-wrap">
            <PaseoMapLoader route={route} live />
          </div>

          <label className="btn btn-primary" style={{ marginTop: 16, cursor: 'pointer', justifyContent: 'center', width: '100%' }}>
            Finalizar paseo — tomar foto de término
            <input
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleEndPhoto(e.target.files[0])}
            />
          </label>
        </>
      )}
    </div>
  )
}
