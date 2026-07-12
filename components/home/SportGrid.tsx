'use client'

import { useRouter } from 'next/navigation'
import { DISCIPLINE_ICON } from '@/components/ui/Icons'
import type { Discipline, EventRow } from '@/lib/supabase/types'

const SPORTS: Discipline[] = ['Running', 'Triatlón', 'Ciclismo']

export function SportGrid({ events }: { events: EventRow[] }) {
  const router = useRouter()

  return (
    <div className="sport-grid">
      {SPORTS.map((sport) => {
        const list = events.filter((e) => e.discipline === sport)
        const avg = list.length ? Math.round(list.reduce((sum, e) => sum + (e.score ?? 0), 0) / list.length) : 0
        const Icon = DISCIPLINE_ICON[sport]

        return (
          <button
            type="button"
            key={sport}
            className="sport-card"
            onClick={() => router.push(`/explorar?deporte=${encodeURIComponent(sport)}`)}
          >
            <div className="icon-badge">
              <Icon />
            </div>
            <h3>{sport}</h3>
            <div className="sc-row">
              <div className="metric">
                <div className="mval">{list.length}</div>
                <div className="mlbl">Activas</div>
              </div>
              <div className="metric" style={{ textAlign: 'right' }}>
                <div className="mval">{avg}</div>
                <div className="mlbl">Score prom.</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
