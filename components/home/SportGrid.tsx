'use client'

import { useRouter } from 'next/navigation'
import { DISCIPLINE_ICON } from '@/components/ui/Icons'
import type { Discipline, EventRow } from '@/lib/supabase/types'

const SPORTS: Discipline[] = ['Running', 'Triatlón', 'Ciclismo']

const MEDALS = ['🥇', '🥈', '🥉']

function nextRaceCopy(list: EventRow[]): string | null {
  const now = Date.now()
  const upcoming = list
    .map((e) => new Date(e.event_date).getTime())
    .filter((t) => t > now)
    .sort((a, b) => a - b)
  if (!upcoming.length) return null
  const days = Math.max(1, Math.ceil((upcoming[0] - now) / 86_400_000))
  if (days === 1) return 'Próxima: mañana'
  if (days < 30) return `Próxima: en ${days} días`
  const months = Math.round(days / 30)
  return `Próxima: en ${months} ${months === 1 ? 'mes' : 'meses'}`
}

export function SportGrid({ events }: { events: EventRow[] }) {
  const router = useRouter()

  return (
    <div className="sport-grid">
      {SPORTS.map((sport, i) => {
        const list = [...events].filter((e) => e.discipline === sport).sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        const top3 = list.slice(0, 3)
        const hero = top3[0]
        const Icon = DISCIPLINE_ICON[sport]
        const nextRace = nextRaceCopy(list)

        return (
          <button
            type="button"
            key={sport}
            className="sport-vibe-card"
            style={{ animationDelay: `${i * 90}ms` }}
            onClick={() => router.push(`/explorar?deporte=${encodeURIComponent(sport)}`)}
          >
            {hero?.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img className="svc-bg" src={hero.image_url} alt="" />
            )}

            <div className="svc-top">
              <div className="svc-icon">
                <Icon />
              </div>
              <div>
                <h3 className="svc-name">{sport}</h3>
                <span className="svc-count">{list.length} carreras activas</span>
              </div>
            </div>

            {top3.length > 0 && (
              <div className="svc-board">
                {top3.map((e, idx) => (
                  <div className="svc-row" key={e.id}>
                    <span className="svc-medal">{MEDALS[idx]}</span>
                    <span className="svc-rname">{e.name}</span>
                    <span className="svc-rscore">{e.score ?? 0}%</span>
                  </div>
                ))}
              </div>
            )}

            <div className="svc-bottom">
              {nextRace && <span className="svc-next">{nextRace}</span>}
              <span className="svc-cta">Ver ranking completo →</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
