import { notFound } from 'next/navigation'
import { getEventBySlug, getEvents } from '@/lib/events-server'
import { costRange, fmtCLP, costLabel, feelsLikeC, triLegsFor, cutoffInfoFor } from '@/lib/events'
import { ElevationChart } from '@/components/ui/ElevationChart'
import { CheckIcon, ThermoIcon, WaveIcon, MountainIcon, UsersIcon, CoinIcon, ClockIcon, StarIcon } from '@/components/ui/Icons'
import { EventCard } from '@/components/ui/EventCard'
import { CircuitMapLoader } from '@/components/ui/CircuitMapLoader'
import { RealPerformancePanel } from '@/components/eventos/RealPerformancePanel'
import { DetailBack, DetailCtaRow } from './DetailActions'

const SAMPLE_REVIEWS = [
  { who: 'Camila R.', stars: 5, text: 'El clima y el circuito coincidieron con lo que predijo el score.' },
  { who: 'Matías V.', stars: 5, text: 'La organización estuvo a la altura del desafío. Repetiría sin dudar.' },
  { who: 'Francisca A.', stars: 4, text: 'Superó lo que esperaba en ambiente. Vale cada peso.' },
]

const AVATAR_COLORS = ['#2f9bff', '#22c55e', '#f59e0b', '#a855f7', '#ef4444']

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function colorFor(name: string) {
  const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

function daysUntilLabel(eventDateISO: string) {
  const days = Math.ceil((new Date(eventDateISO).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return null
  if (days === 0) return '¡Es hoy!'
  if (days === 1) return 'Es mañana'
  return `Faltan ${days} días`
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const event = await getEventBySlug(slug).catch(() => null)
  if (!event) notFound()

  const allEvents = await getEvents()
  const similar = allEvents
    .filter((e) => e.id !== event.id && e.discipline === event.discipline)
    .concat(allEvents.filter((e) => e.id !== event.id && e.discipline !== event.discipline))
    .slice(0, 4)

  const cost = costRange(event)
  const eventDate = new Date(event.event_date).toLocaleDateString('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const countdown = daysUntilLabel(event.event_date)
  const feelsLike = feelsLikeC(event.temp_avg_c ?? 20, event.humidity_pct ?? 50)
  const legs = triLegsFor(event.distances)
  const cutoff = cutoffInfoFor(event.distances)

  return (
    <div className="view-enter">
      <div className="detail-hero photo-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image_url ?? `https://picsum.photos/seed/${event.slug}/1600/900`} alt={event.name} />
        <DetailBack />
        <div className="detail-hero-content wrap">
          <div className="eyebrow">{event.discipline}</div>
          <h1>{event.name}</h1>
          <div className="loc">
            {event.city}, {event.region} · {eventDate}
          </div>
          {countdown && (
            <div className="detail-countdown">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              {countdown}
            </div>
          )}
          {event.blurb && <p className="detail-hook">{event.blurb}</p>}
          <DetailCtaRow eventId={event.id} eventName={event.name} />
        </div>
      </div>

      <div className="wrap section" style={{ paddingTop: 0 }}>
        {event.distances && event.distances.length > 0 && (
          <div className="dist-tabs">
            {event.distances.map((d, i) => (
              <span key={d} className={`dist-tab ${i === event.distances!.length - 1 ? 'active' : ''}`}>
                {d}
              </span>
            ))}
          </div>
        )}

        {event.stats_estimated && (
          <div className="estimate-banner">
            <span className="estimate-banner-icon">📊</span>
            <p>
              <b>Fecha, precio de inscripción y formato de distancia son datos confirmados</b> por la organización.
              Clima, desnivel, cupos e indicadores de nivel de esta carrera todavía son{' '}
              <b>estimaciones editoriales nuestras</b>, no datos oficiales confirmados — los actualizaremos apenas
              tengamos la fuente real.
            </p>
          </div>
        )}

        <div className="stat-grid8">
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <ThermoIcon />
            </div>
            <div>
              <div className="stat-tile-val">{feelsLike}°</div>
              <span className="stat-tile-sub">Real: {event.temp_avg_c}°</span>
            </div>
            <div className="stat-tile-lbl">Sensación térmica</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <WaveIcon />
            </div>
            <div>
              <div className="stat-tile-val">{event.humidity_pct}%</div>
            </div>
            <div className="stat-tile-lbl">Humedad</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <MountainIcon />
            </div>
            <div>
              <div className="stat-tile-val">{event.elevation_gain_m}m</div>
            </div>
            <div className="stat-tile-lbl">Desnivel total</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <UsersIcon />
            </div>
            <div>
              <div className="stat-tile-val">{event.entrants ? (event.entrants / 1000).toFixed(1) : '—'}k</div>
            </div>
            <div className="stat-tile-lbl">Inscritos</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <CoinIcon />
            </div>
            <div>
              <div className="stat-tile-val">{fmtCLP(event.price_clp)}</div>
            </div>
            <div className="stat-tile-lbl">Inscripción</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <ClockIcon />
            </div>
            <div>
              <div className="stat-tile-val">{cutoff?.label ?? event.cutoff_pressure}</div>
              {cutoff && <span className="stat-tile-sub">Tiempo límite total</span>}
            </div>
            <div className="stat-tile-lbl">Tiempo de corte</div>
          </div>
          <div className="stat-tile">
            <div className="stat-tile-icon">
              <StarIcon />
            </div>
            <div>
              <div className="stat-tile-val">{event.rating}</div>
            </div>
            <div className="stat-tile-lbl">Rating</div>
          </div>
        </div>

        <RealPerformancePanel event={event} />

        <div className="block">
          <div className="block-head">
            <h3 className="h">El circuito</h3>
          </div>
          {event.circuit_type && <p className="route-hook">{event.circuit_type}</p>}

          {legs && (
            <div className="leg-breakdown">
              <div className="leg-row">
                <span className="leg-icon">🏊</span>
                <span className="leg-name">Nado</span>
                <span className="leg-dist">{legs.swimKm} km</span>
              </div>
              <div className="leg-row">
                <span className="leg-icon">🚴</span>
                <span className="leg-name">Bici</span>
                <span className="leg-dist">{legs.bikeKm} km</span>
              </div>
              <div className="leg-row">
                <span className="leg-icon">🏃</span>
                <span className="leg-name">Trote</span>
                <span className="leg-dist">{legs.runKm} km</span>
              </div>
              {cutoff && (
                <p className="leg-cutoff-note">
                  ⏱ Tiempo de corte total: <b>{cutoff.label}</b>. {cutoff.note}
                </p>
              )}
            </div>
          )}

          {event.lat != null && event.lng != null && (
            <CircuitMapLoader lat={event.lat} lng={event.lng} name={event.name} city={event.city} region={event.region} />
          )}
          <div className="route-card">
            <div>
              <ElevationChart elevation={event.elevation_gain_m ?? 0} />
              <div className="route-legend">
                <div>
                  Superficie<span>{event.surface}</span>
                </div>
                <div>
                  Desnivel<span>+{event.elevation_gain_m}m</span>
                </div>
                <div>
                  Altitud máx.<span>{event.altitude_m}m</span>
                </div>
              </div>
            </div>
            <div>
              <div className="route-legend" style={{ gridTemplateColumns: '1fr' }}>
                <div>
                  Distancias<span>{event.distances?.join(' · ')}</span>
                </div>
                <div>
                  Nivel de competitividad<span>{event.competitive_level}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="block">
          <div className="block-head">
            <h3 className="h">Costo total estimado</h3>
          </div>
          <div className="cost-block">
            <div className="cost-rows">
              <div className="cost-row">
                <span className="k">Inscripción</span>
                <span className="v">{fmtCLP(event.price_clp)}</span>
              </div>
              <div className="cost-row">
                <span className="k">
                  Traslado
                  <small>{event.travel_mode}</small>
                </span>
                <span className="v">
                  {event.travel_max_clp === 0 ? '—' : `${fmtCLP(event.travel_min_clp)}–${fmtCLP(event.travel_max_clp)}`}
                </span>
              </div>
              <div className="cost-row">
                <span className="k">
                  Alojamiento
                  <small>{event.lodging_label}</small>
                </span>
                <span className="v">
                  {event.lodging_max_clp === 0 ? '—' : `${fmtCLP(event.lodging_min_clp)}–${fmtCLP(event.lodging_max_clp)}`}
                </span>
              </div>
              <div className="cost-total">
                <span className="k">Total estimado</span>
                <span className="v">{costLabel(event)}</span>
              </div>
            </div>
            <div>
              <div className="kit-title">El kit incluye</div>
              <div className="kit-list">
                {event.kit_includes?.map((k) => (
                  <div className="kit-row" key={k}>
                    <CheckIcon />
                    {k}
                  </div>
                ))}
              </div>
            </div>
            <div className="cost-note">
              La inscripción es el precio real informado por la organización. El traslado y alojamiento son un rango
              realista según tarifas de vuelo ida/vuelta Santiago–{event.city} y alojamiento básico–medio en{' '}
              {event.city}, no una cotización en vivo — los precios reales varían según fecha y disponibilidad, así
              que confírmalos antes de comprar. {cost.min !== cost.max && `Rango total: ${fmtCLP(cost.min)} a ${fmtCLP(cost.max)}.`}
            </div>
          </div>
        </div>

        <div className="block">
          <div className="block-head">
            <h3 className="h">Opiniones</h3>
          </div>
          <div className="review-hero">
            <span className="quote-mark">&ldquo;</span>
            <p>{SAMPLE_REVIEWS[0].text}</p>
            <div className="review-hero-who">
              <span className="avatar" style={{ background: colorFor(SAMPLE_REVIEWS[0].who) }}>
                {initials(SAMPLE_REVIEWS[0].who)}
              </span>
              <div>
                <div className="who">{SAMPLE_REVIEWS[0].who}</div>
                <div className="stars">
                  {'★'.repeat(SAMPLE_REVIEWS[0].stars)}
                  {'☆'.repeat(5 - SAMPLE_REVIEWS[0].stars)}
                </div>
              </div>
            </div>
          </div>
          {SAMPLE_REVIEWS.slice(1).map((r) => (
            <div className="review-line" key={r.who}>
              <div className="review-line-who">
                <span className="avatar sm" style={{ background: colorFor(r.who) }}>
                  {initials(r.who)}
                </span>
                <div>
                  <div className="who">{r.who}</div>
                  <div className="txt">{r.text}</div>
                </div>
              </div>
              <div className="stars">{'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}</div>
            </div>
          ))}
        </div>

        {similar.length > 0 && (
          <div className="block" style={{ marginBottom: 0 }}>
            <div className="block-head">
              <h3 className="h">Eventos parecidos</h3>
            </div>
            <div className="rail">
              {similar.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
