import { getEvents } from '@/lib/events-server'
import { isLaunched } from '@/lib/events'
import { Hero } from '@/components/home/Hero'
import { MatchConsole } from '@/components/match/MatchConsole'
import { SportGrid } from '@/components/home/SportGrid'
import { Rail } from '@/components/home/Rail'
import type { Discipline, EventRow } from '@/lib/supabase/types'

export const revalidate = 60

function byDiscipline(events: EventRow[], discipline: Discipline) {
  return events.filter((e) => e.discipline === discipline).sort((a, b) => (b.pr_probability ?? 0) - (a.pr_probability ?? 0))
}

export default async function Home() {
  const events = await getEvents()
  const launchedEvents = events.filter((e) => isLaunched(e.discipline))

  const best = [...launchedEvents].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
  const avgCompat = launchedEvents.length
    ? Math.round(launchedEvents.reduce((sum, e) => sum + (e.compatibility ?? 0), 0) / launchedEvents.length)
    : 0

  const triatlon = byDiscipline(launchedEvents, 'Triatlón')

  const heroFeatured = [...launchedEvents].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, 3)

  return (
    <div className="wrap view-enter">
      <div className="page-head">
        <div className="eyebrow">Motor de compatibilidad deportiva</div>
        <h1>Encuentra el evento perfecto para ti.</h1>
        <p>
          Analizamos tu rendimiento, el recorrido, el clima, el desnivel, el costo y cientos de variables para
          decirte en qué carreras tendrás mayores posibilidades de disfrutar, mejorar o competir.
        </p>
      </div>

      <Hero
        featured={heroFeatured}
        stats={{
          totalEvents: launchedEvents.length,
          disciplineCount: 3,
          bestScore: best?.score ?? 0,
          bestName: best?.name ?? '—',
          avgCompat,
        }}
      />

      <section className="section" id="match-section">
        <MatchConsole events={events} />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Explora por deporte</h2>
            <p>Cada disciplina con su propio ranking</p>
          </div>
        </div>
        <SportGrid events={events} />
      </section>

      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="section-head">
          <div>
            <h2>Triatlón</h2>
            <p>Ordenadas por probabilidad de PR dentro de triatlón</p>
          </div>
        </div>
        <Rail events={triatlon} />
      </section>
    </div>
  )
}
