'use client'

import Link from 'next/link'
import type { MouseEvent } from 'react'
import { Ring } from '@/components/ui/Ring'
import { DISCIPLINE_ICON, HeartIcon, CompareIcon } from '@/components/ui/Icons'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'
import { costLabel } from '@/lib/events'
import type { EventRow } from '@/lib/supabase/types'

export function EventCard({ event }: { event: EventRow }) {
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { isCompared, toggle: toggleCompare } = useCompare()
  const DiscIcon = DISCIPLINE_ICON[event.discipline]
  const fav = isFavorite(event.id)
  const compared = isCompared(event.id)

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

      <div>
        <div className="card-name">{event.name}</div>
        <div className="card-meta">
          {event.city} ·{' '}
          {new Date(event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>

      <div className="card-score-row">
        <Ring score={event.score ?? 0} size={52} stroke={5} fontSize={15} />
        <div className="card-stats-mini">
          <div className="mini-stat">
            <div className="v">{event.pr_probability ?? '—'}%</div>
            <div className="l">Prob. PR</div>
          </div>
          <div className="mini-stat">
            <div className="v">{costLabel(event)}</div>
            <div className="l">Costo total</div>
          </div>
        </div>
      </div>
    </Link>
  )
}
