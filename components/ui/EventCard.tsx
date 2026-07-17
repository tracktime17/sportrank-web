'use client'

import Link from 'next/link'
import type { MouseEvent } from 'react'
import { DISCIPLINE_ICON, HeartIcon, CompareIcon } from '@/components/ui/Icons'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'
import type { EventRow } from '@/lib/supabase/types'

function formatEntrants(n: number | null): string | null {
  if (!n) return null
  if (n >= 1000) return `${Math.round(n / 100) / 10}K corredores`
  return `${n} corredores`
}

function bestSignal(e: EventRow): { icon: string; label: string } | null {
  const rating = Number(e.rating ?? 0)
  if (rating >= 4.8) return { icon: '⭐', label: 'Mejor calificada' }
  if ((e.entrants ?? 0) >= 10000) return { icon: '🔥', label: 'Carrera masiva' }
  if (e.landscape_rating === 5) return { icon: '🏞️', label: 'Paisaje excepcional' }
  if ((e.pr_probability ?? 0) >= 75) return { icon: '📈', label: 'Alta prob. de PR' }
  const topPct = e.position_label ? parseInt(e.position_label.replace(/\D/g, ''), 10) : NaN
  if (!Number.isNaN(topPct) && topPct <= 10) return { icon: '🏆', label: e.position_label! }
  return null
}

export function EventCard({ event }: { event: EventRow }) {
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { isCompared, toggle: toggleCompare } = useCompare()
  const DiscIcon = DISCIPLINE_ICON[event.discipline]
  const fav = isFavorite(event.id)
  const compared = isCompared(event.id)
  const signal = bestSignal(event)
  const entrantsLabel = formatEntrants(event.entrants)

  function onToggleFav(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleFavorite(event.id)
  }

  function onToggleCompare(e: MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    toggleCompare(event.id)
  }

  return (
    <Link href={`/eventos/${event.slug}`} className="card">
      {event.image_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img className="card-bg" src={event.image_url} alt="" />
      )}

      <div className="card-top">
        <div className="card-disc">
          <div className="icon-badge-sm">
            <DiscIcon />
          </div>
          <span className="dname">{event.discipline}</span>
        </div>
        <div className="card-actions">
          <button
            type="button"
            className={`icon-btn ${compared ? 'is-compared' : ''}`}
            onClick={onToggleCompare}
            aria-label="Agregar a comparar"
          >
            <CompareIcon />
          </button>
          <button
            type="button"
            className={`icon-btn ${fav ? 'active' : ''}`}
            onClick={onToggleFav}
            aria-label="Guardar en favoritos"
          >
            <HeartIcon />
          </button>
        </div>
      </div>

      {signal && (
        <div className="card-signal">
          {signal.icon} {signal.label}
        </div>
      )}
      {event.stats_estimated && <div className="card-estimate">🧮 Proyección NextRace</div>}

      <div className="card-bottom">
        <div className="card-score-badge">{event.score ?? 0}%</div>
        <div className="card-name">{event.name}</div>
        {event.blurb && <p className="card-blurb">{event.blurb}</p>}
        <div className="card-meta">
          {event.city} ·{' '}
          {new Date(event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
        <div className="card-social-row">
          {event.rating && <span className="card-chip">★ {event.rating}</span>}
          {entrantsLabel && <span className="card-chip">{entrantsLabel}</span>}
        </div>
      </div>
    </Link>
  )
}
