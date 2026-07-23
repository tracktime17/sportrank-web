'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { claimBooking, addRoutePoint, endWalk, getBooking } from '@/lib/paseos/api'
import { PaseoMapLoader } from '@/components/paseos/PaseoMapLoader'
import { fmtDistance, fmtMinutes, totalDistanceMeters } from '@/lib/paseos/geo'
import type { Booking, RoutePoint } from '@/lib/paseos/types'

// Ignora puntos claramente ruidosos: precisión muy mala, o saltos tan chicos
// que son solo jitter del GPS estando quieto.
const MIN_ACCURACY_M = 80
const MIN_MOVE_M = 4

export default function CaminarPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()

  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [route, setRoute] = useState<RoutePoint[]>([])
  const [elapsedS, setElapsedS] = useState(0)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [claiming, setClaiming] = useState(false)
  const watchIdRef = useRef<number | null>(null)
  const lastPointRef = useRef<RoutePoint | null>(null)
  const startedAtRef = useRef<number | null>(null)

  const phase: 'before' | 'during' | 'taken' | 'cancelled' =
    booking?.status === 'cancelado'
      ? 'cancelled'
      : booking?.status === 'en_curso'
        ? booking.isClaimedByMe
          ? 'during'
          : 'taken'
        : 'before'
  const geoSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator

  useEffect(() => {
    getBooking(params.id)
      .then((b) => {
        setBooking(b)
        if (b) {
          setRoute(b.session.route)
          startedAtRef.current = b.session.startedAt
        }
      })
      .catch((err) => setLoadError(err.message))
      .finally(() => setLoading(false))
  }, [params.id])

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
        setRoute((prev) => {
          const next = [...prev, point]
          addRoutePoint(params.id, next).catch(() => {
            /* se reintentará con el próximo punto; no bloquea el registro local */
          })
          return next
        })
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
    if (phase !== 'during' || !startedAtRef.current) return
    const startedAt = startedAtRef.current
    const interval = setInterval(() => setElapsedS(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [phase])

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }, [])

  useEffect(() => {
    if (booking?.status === 'completado') router.replace(`/paseos/${params.id}`)
  }, [booking?.status, params.id, router])

  async function handleStartPhoto(file: File) {
    if (!booking) return
    setClaiming(true)
    setLoadError(null)
    try {
      const claimed = await claimBooking(params.id, file)
      startedAtRef.current = claimed.session.startedAt
      setBooking(claimed)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'No se pudo iniciar el paseo.')
    } finally {
      setClaiming(false)
    }
  }

  async function handleEndPhoto(file: File) {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    await endWalk(params.id, file)
    router.push(`/paseos/${params.id}`)
  }

  if (loading) return null

  if (loadError && !booking) {
    return (
      <div className="wrap view-enter" style={{ paddingTop: 44 }}>
        <div className="empty-state">
          <h2>No pudimos abrir este paseo</h2>
          <p>{loadError}</p>
          <Link href="/paseos" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>
            Volver a Huella
          </Link>
        </div>
      </div>
    )
  }

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
      {loadError && <div className="paseo-flag paseo-flag-bad">{loadError}</div>}

      {phase === 'taken' && (
        <div className="paseo-panel">
          <h3>Este paseo ya fue tomado</h3>
          <p>Otro paseador ya inició el registro de este paseo desde su celular — no puedes iniciarlo también.</p>
          <div className="paseo-cta-row" style={{ marginTop: 16 }}>
            <Link href={`/paseos/${params.id}`} className="btn btn-ghost">
              Ver el paseo
            </Link>
          </div>
        </div>
      )}

      {phase === 'cancelled' && (
        <div className="paseo-panel">
          <h3>Este paseo fue cancelado</h3>
          <p>El dueño canceló este paseo — ya no se puede iniciar.</p>
        </div>
      )}

      {phase === 'before' && (
        <div className="paseo-panel">
          <h3>Paso 1 — Foto de inicio</h3>
          <p>Toma una foto del perro justo antes de comenzar. Al confirmar, empezamos a registrar la ruta GPS.</p>
          <label className="btn btn-primary" style={{ marginTop: 16, cursor: 'pointer', justifyContent: 'center' }}>
            {claiming ? 'Iniciando…' : 'Tomar foto y comenzar'}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={claiming}
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
