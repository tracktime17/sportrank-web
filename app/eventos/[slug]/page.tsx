import { notFound } from 'next/navigation'
import { getEventBySlug, getEvents } from '@/lib/events-server'
import { costRange, fmtCLP, costLabel } from '@/lib/events'
import { Ring } from '@/components/ui/Ring'
import { ElevationChart } from '@/components/ui/ElevationChart'
import { CheckIcon } from '@/components/ui/Icons'
import { EventCard } from '@/components/ui/EventCard'
import { DetailActions } from './DetailActions'

const SAMPLE_REVIEWS = [
  { who: 'Camila R.', stars: 5, text: 'El clima y el circuito coincidieron con lo que predijo el score.' },
  { who: 'Matías V.', stars: 5, text: 'La organización estuvo a la altura del desafío. Repetiría sin dudar.' },
  { who: 'Francisca A.', stars: 4, text: 'Superó lo que esperaba en ambiente. Vale cada peso.' },
]

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

  return (
    <div className="view-enter">
      <div className="detail-hero photo-panel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.image_url ?? `https://picsum.photos/seed/${event.slug}/1600/900`} alt={event.name} />
        <DetailActions eventId={event.id} />
        <div className="detail-hero-content wrap">
          <div className="eyebrow">{event.discipline}</div>
          <h1>{event.name}</h1>
          <div className="loc">
            {event.city}, {event.region} · {eventDate}
          </div>
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

        <div className="stat-grid6">
          <div className="cell metric">
            <div className="mval">{event.temp_avg_c}°</div>
            <div className="mlbl">Temp.</div>
          </div>
          <div className="cell metric">
            <div className="mval">{event.humidity_pct}%</div>
            <div className="mlbl">Humedad</div>
          </div>
          <div className="cell metric">
            <div className="mval">{event.elevation_gain_m}m</div>
            <div className="mlbl">Desnivel</div>
          </div>
          <div className="cell metric">
            <div className="mval">{event.entrants ? (event.entrants / 1000).toFixed(1) : '—'}k</div>
            <div className="mlbl">Inscritos</div>
          </div>
          <div className="cell metric">
            <div className="mval">{fmtCLP(event.price_clp)}</div>
            <div className="mlbl">Inscripción</div>
          </div>
          <div className="cell metric">
            <div className="mval">{event.rating}</div>
            <div className="mlbl">Rating</div>
          </div>
        </div>

        <div className="perf-panel">
          <div>
            <Ring score={event.score ?? 0} size={150} stroke={12} fontSize={38} />
            <div className="ring-lbl">Performance Score</div>
          </div>
          <div>
            <h3>
              Entre el <span>{event.position_label?.replace('Top ', '')}</span> de eventos donde tienes mayor
              probabilidad de tu mejor resultado
            </h3>
            <p className="blurb">{event.blurb}</p>
            <div className="perf-metrics">
              <div className="metric">
                <div className="mval">{event.projected_time}</div>
                <div className="mlbl">Tiempo proyectado</div>
              </div>
              <div className="metric">
                <div className="mval">{event.position_label}</div>
                <div className="mlbl">Posición estimada</div>
              </div>
              <div className="metric">
                <div className="mval">{event.pr_probability}%</div>
                <div className="mlbl">Prob. de PR</div>
              </div>
              <div className="metric">
                <div className="mval">{event.compatibility}%</div>
                <div className="mlbl">Compatibilidad</div>
              </div>
            </div>
          </div>
        </div>

        <div className="block">
          <div className="block-head">
            <h3 className="h">El circuito</h3>
          </div>
          <div className="route-card">
            <div>
              <ElevationChart elevation={event.elevation_gain_m ?? 0} />
              <div className="route-legend">
                <div>
                  Tipo<span>{event.circuit_type}</span>
                </div>
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
              Estimado desde Santiago, con bandas de traslado y alojamiento — no es una cotización exacta ni compite
              con tu Performance Score: esto responde si te conviene pagarla, no si rindes bien ahí.{' '}
              {cost.min !== cost.max && `Rango: ${fmtCLP(cost.min)} a ${fmtCLP(cost.max)}.`}
            </div>
          </div>
        </div>

        <div className="block">
          <div className="block-head">
            <h3 className="h">Opiniones</h3>
          </div>
          {SAMPLE_REVIEWS.map((r) => (
            <div className="review-line" key={r.who}>
              <div>
                <div className="who">{r.who}</div>
                <div className="txt">{r.text}</div>
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
