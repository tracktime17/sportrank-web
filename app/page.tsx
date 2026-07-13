import { getEvents } from '@/lib/events-server'
import { Hero } from '@/components/home/Hero'
import { MatchConsole } from '@/components/match/MatchConsole'
import { SportGrid } from '@/components/home/SportGrid'
import { Rail } from '@/components/home/Rail'
import type { Discipline, EventRow } from '@/lib/supabase/types'

function byDiscipline(events: EventRow[], discipline: Discipline) {
  return events.filter((e) => e.discipline === discipline).sort((a, b) => (b.pr_probability ?? 0) - (a.pr_probability ?? 0))
}

function topByScore(events: EventRow[], discipline: Discipline) {
  return [...events]
    .filter((e) => e.discipline === discipline)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
}

export default async function Home() {
  const events = await getEvents()
  const best = [...events].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0]
  const avgCompat = events.length
    ? Math.round(events.reduce((sum, e) => sum + (e.compatibility ?? 0), 0) / events.length)
    : 0

  const running = byDiscipline(events, 'Running')
  const triatlon = byDiscipline(events, 'Triatlón')
  const ciclismo = byDiscipline(events, 'Ciclismo')

  const topPerDiscipline = (['Running', 'Triatlón', 'Ciclismo'] as const)
    .map((d) => topByScore(events, d))
    .filter((e): e is EventRow => Boolean(e))
  const heroMain = best ?? topPerDiscipline[0]
  const heroFeatured = heroMain
    ? [heroMain, ...topPerDiscipline.filter((e) => e.id !== heroMain.id)]
    : []

  return (
    <div className="wrap view-enter">
      <div className="page-head">
        <div className="eyebrow">Motor de compatibilidad deportiva</div>
        <h1>Descubre dónde tendrás tu mejor rendimiento.</h1>
        <p>
          Running, triatlón y ciclismo, evaluados uno por uno contra tu distancia, tu terreno, tu clima y tu nivel —
          nunca comparados entre sí.
        </p>
      </div>

      <div className="stat-row">
        <div className="cell metric">
          <div className="mval">{events.length}</div>
          <div className="mlbl">Competencias activas</div>
        </div>
        <div className="cell metric">
          <div className="mval">3</div>
          <div className="mlbl">Disciplinas</div>
        </div>
        {best && (
          <div className="cell metric">
            <div className="mval accent">{best.score}</div>
            <div className="mlbl">Score más alto — {best.name.split(' ').slice(0, 2).join(' ')}</div>
          </div>
        )}
        <div className="cell metric">
          <div className="mval">{avgCompat}%</div>
          <div className="mlbl">Compatibilidad promedio</div>
        </div>
      </div>

      <Hero featured={heroFeatured} />

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

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Running</h2>
            <p>Ordenadas por probabilidad de PR dentro de running</p>
          </div>
        </div>
        <Rail events={running} />
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <h2>Triatlón</h2>
            <p>Ordenadas por probabilidad de PR dentro de triatlón</p>
          </div>
        </div>
        <Rail events={triatlon} />
      </section>

      <section className="section" style={{ paddingBottom: 24 }}>
        <div className="section-head">
          <div>
            <h2>Ciclismo</h2>
            <p>Ordenadas por probabilidad de PR dentro de ciclismo</p>
          </div>
        </div>
        <Rail events={ciclismo} />
      </section>
    </div>
  )
}
