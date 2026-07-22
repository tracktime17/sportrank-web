'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { usePaseoStore } from '@/lib/paseos/store'
import { VerificationBadge } from '@/components/paseos/VerificationBadge'
import { fmtDistance, fmtMinutes } from '@/lib/paseos/geo'

export default function PaseosLanding() {
  const router = useRouter()
  const { bookings, hydrated, seedDemo } = usePaseoStore()

  function verEjemplo(kind: 'verificado' | 'revisar') {
    const id = seedDemo(kind)
    router.push(`/paseos/${id}`)
  }

  return (
    <div className="wrap view-enter" style={{ paddingTop: 44 }}>
      <div className="page-head">
        <div className="eyebrow">Paseo Verificado</div>
        <h1>¿Realmente pasearon a tu perro?</h1>
        <p>
          Huella registra la ruta GPS, la duración real y fotos de inicio/término de cada paseo, y te entrega un
          reporte claro de verificación — para que dejes de depender de la palabra del paseador.
        </p>
      </div>

      <div className="paseo-how">
        <div className="paseo-how-step">
          <div className="paseo-how-num">1</div>
          <h3>Agenda el paseo</h3>
          <p>Defines el perro, el paseador y la duración acordada.</p>
        </div>
        <div className="paseo-how-step">
          <div className="paseo-how-num">2</div>
          <h3>El paseador registra en vivo</h3>
          <p>Foto de inicio, ruta GPS en tiempo real y foto de término — todo desde el celular del paseador.</p>
        </div>
        <div className="paseo-how-step">
          <div className="paseo-how-num">3</div>
          <h3>Recibes el reporte</h3>
          <p>Mapa de la ruta, duración real vs. acordada, y un veredicto: verificado, revisar o no verificado.</p>
        </div>
      </div>

      <div className="paseo-cta-row">
        <Link href="/paseos/nuevo" className="btn btn-primary">
          Crear un paseo
        </Link>
        <button type="button" className="btn btn-ghost" onClick={() => verEjemplo('verificado')}>
          Ver ejemplo verificado
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => verEjemplo('revisar')}>
          Ver ejemplo con alertas
        </button>
      </div>

      <section className="section" style={{ paddingTop: 8 }}>
        <div className="section-head">
          <div>
            <h2>Tus paseos</h2>
            <p>{hydrated && bookings.length > 0 ? `${bookings.length} registrados en este navegador` : ''}</p>
          </div>
        </div>

        {!hydrated ? null : bookings.length === 0 ? (
          <div className="empty-state">
            <h2>Aún no has creado ningún paseo</h2>
            <p>Crea uno para agendarlo, o revisa un ejemplo para ver cómo luce el reporte de verificación.</p>
          </div>
        ) : (
          <div className="paseo-list">
            {bookings.map((b) => (
              <Link key={b.id} href={`/paseos/${b.id}`} className="paseo-list-item">
                <div>
                  <div className="paseo-list-title">
                    {b.dogName} {b.dogBreed ? <span className="paseo-list-breed">· {b.dogBreed}</span> : null}
                  </div>
                  <div className="paseo-list-sub">
                    Paseador: {b.walkerName} · {b.expectedMinutes} min acordados
                    {b.session.verification ? (
                      <>
                        {' '}
                        · {fmtMinutes(b.session.verification.actualMinutes)} reales · {fmtDistance(b.session.verification.distanceM)}
                      </>
                    ) : null}
                  </div>
                </div>
                {b.session.verification ? (
                  <VerificationBadge status={b.session.verification.status} />
                ) : (
                  <span className="paseo-badge paseo-badge-pending">
                    {b.status === 'en_curso' ? 'En curso' : b.status === 'cancelado' ? 'Cancelado' : 'Pendiente'}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
