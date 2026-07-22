'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { usePaseoStore } from '@/lib/paseos/store'
import { PaseoMapLoader } from '@/components/paseos/PaseoMapLoader'
import { VerificationBadge } from '@/components/paseos/VerificationBadge'
import { fmtDistance, fmtMinutes } from '@/lib/paseos/geo'

export default function PaseoDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { hydrated, getBooking, cancelBooking } = usePaseoStore()

  if (!hydrated) return null

  const booking = getBooking(params.id)

  if (!booking) {
    return (
      <div className="wrap view-enter" style={{ paddingTop: 44 }}>
        <div className="empty-state">
          <h2>No encontramos este paseo</h2>
          <p>Puede que haya sido creado en otro navegador — los datos de este prototipo viven solo en tu dispositivo.</p>
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
          <p>Cuando el paseador llegue, debe iniciar el registro desde este mismo enlace.</p>
          <div className="paseo-cta-row" style={{ marginTop: 16 }}>
            <Link href={`/paseos/${booking.id}/caminar`} className="btn btn-primary">
              Soy el paseador — iniciar paseo
            </Link>
            <button type="button" className="btn btn-ghost" onClick={() => cancelBooking(booking.id)}>
              Cancelar paseo
            </button>
          </div>
        </div>
      )}

      {booking.status === 'en_curso' && (
        <div className="paseo-panel">
          <h3>Paseo en curso</h3>
          <p>El paseador comenzó el registro y aún no lo termina.</p>
          <div className="paseo-cta-row" style={{ marginTop: 16 }}>
            <Link href={`/paseos/${booking.id}/caminar`} className="btn btn-primary">
              Continuar registro
            </Link>
          </div>
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
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => router.push('/paseos')}>
              Volver
            </button>
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
