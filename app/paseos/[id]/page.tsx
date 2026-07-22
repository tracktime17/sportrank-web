'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { cancelBooking, getBooking } from '@/lib/paseos/api'
import { PaseoMapLoader } from '@/components/paseos/PaseoMapLoader'
import { VerificationBadge } from '@/components/paseos/VerificationBadge'
import { fmtDistance, fmtMinutes } from '@/lib/paseos/geo'
import type { Booking } from '@/lib/paseos/types'

export default function PaseoDetailPage() {
  const params = useParams<{ id: string }>()
  const [booking, setBooking] = useState<Booking | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false
    function load() {
      getBooking(params.id)
        .then((b) => {
          if (!cancelled) setBooking(b)
        })
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false))
    }
    load()
    // Mientras no hay un veredicto final, sigue consultando: para que el
    // dueño vea cuando el paseador toma el paseo, y la ruta casi en vivo
    // mientras está en curso.
    const interval = setInterval(() => {
      if (booking?.status === 'pendiente' || booking?.status === 'en_curso') load()
    }, 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [params.id, booking?.status])

  async function handleCancel() {
    if (!booking) return
    await cancelBooking(booking.id)
    setBooking({ ...booking, status: 'cancelado' })
  }

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loading) return null

  if (error || !booking) {
    return (
      <div className="wrap view-enter" style={{ paddingTop: 44 }}>
        <div className="empty-state">
          <h2>No encontramos este paseo</h2>
          <p>{error ?? 'Puede que el link esté mal copiado, o que el paseo ya no exista.'}</p>
          <div style={{ marginTop: 22 }}>
            <Link href="/paseos" className="btn btn-primary">
              Volver a Huella
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const v = booking.session.verification

  return (
    <div className="wrap view-enter" style={{ paddingTop: 44, maxWidth: 720 }}>
      <div className="page-head" style={{ paddingBottom: 16 }}>
        <div className="eyebrow">Paseo de {booking.dogName}</div>
        <h1>
          {booking.dogName}
          {booking.dogBreed ? <span style={{ color: 'var(--text-2)' }}> · {booking.dogBreed}</span> : null}
        </h1>
        <p>
          Paseador: {booking.walkerName} · {booking.expectedMinutes} min acordados
          {booking.priceClp ? ` · $${booking.priceClp.toLocaleString('es-CL')} CLP` : ''}
        </p>
      </div>

      {booking.status === 'pendiente' && (
        <div className="paseo-panel">
          <h3>Paseo agendado</h3>
          <p>Comparte este link con tu paseador — cuando llegue, debe abrirlo e iniciar el registro desde ahí.</p>
          <div className="paseo-cta-row" style={{ marginTop: 16 }}>
            <button type="button" className="btn btn-primary" onClick={copyLink}>
              {copied ? 'Link copiado ✓' : 'Copiar link para el paseador'}
            </button>
            <Link href={`/paseos/${booking.id}/caminar`} className="btn btn-ghost">
              Soy el paseador — iniciar paseo
            </Link>
            <button type="button" className="btn btn-ghost" onClick={handleCancel}>
              Cancelar paseo
            </button>
          </div>
        </div>
      )}

      {booking.status === 'en_curso' && (
        <div className="paseo-panel">
          <h3>Paseo en curso</h3>
          <p>El paseador ya inició el registro. Esta página se actualiza sola mientras el paseo sigue en curso.</p>
          {booking.session.route.length > 0 && (
            <div className="paseo-map-wrap">
              <PaseoMapLoader route={booking.session.route} live />
            </div>
          )}
        </div>
      )}

      {booking.status === 'cancelado' && (
        <div className="paseo-panel">
          <h3>Paseo cancelado</h3>
        </div>
      )}

      {booking.status === 'completado' && v && (
        <>
          <div className="paseo-verdict">
            <VerificationBadge status={v.status} />
            <Link href="/paseos" className="btn btn-ghost btn-sm">
              Volver
            </Link>
          </div>

          {booking.session.route.length > 0 && (
            <div className="paseo-map-wrap">
              <PaseoMapLoader route={booking.session.route} />
            </div>
          )}

          <div className="paseo-stats-grid">
            <div className="paseo-stat">
              <div className="v">{fmtMinutes(v.actualMinutes)}</div>
              <div className="l">Duración real (de {booking.expectedMinutes} min)</div>
            </div>
            <div className="paseo-stat">
              <div className="v">{fmtDistance(v.distanceM)}</div>
              <div className="l">Distancia recorrida</div>
            </div>
            <div className="paseo-stat">
              <div className="v">{v.avgPaceMinPerKm ? `${v.avgPaceMinPerKm.toFixed(1)} min/km` : '—'}</div>
              <div className="l">Ritmo promedio</div>
            </div>
            <div className="paseo-stat">
              <div className="v">{v.pointCount}</div>
              <div className="l">Puntos GPS registrados</div>
            </div>
          </div>

          <div className="paseo-photos-row">
            {booking.session.startPhoto && (
              <div className="paseo-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={booking.session.startPhoto} alt="Foto de inicio" />
                <span>Inicio</span>
              </div>
            )}
            {booking.session.endPhoto && (
              <div className="paseo-photo">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={booking.session.endPhoto} alt="Foto de término" />
                <span>Término</span>
              </div>
            )}
          </div>

          <div className="paseo-flags">
            <h3>Detalle de la verificación</h3>
            {v.flags.map((flag, i) => (
              <div key={i} className={`paseo-flag paseo-flag-${flag.level}`}>
                {flag.message}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
