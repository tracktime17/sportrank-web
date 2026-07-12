'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Seg, type SegOption } from '@/components/ui/Seg'
import { ClimateSlider } from '@/components/ui/ClimateSlider'
import { Ring } from '@/components/ui/Ring'
import { BarsIcon, RunIcon, TriIcon, BikeIcon, BuildingIcon, MountainIcon, WaveIcon } from '@/components/ui/Icons'
import { computeMatch, distanceBucket, MATCH_WEIGHTS, type MatchPreferences } from '@/lib/events'
import type { Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

const SPORTS: SegOption<Discipline>[] = [
  { key: 'Running', label: 'Running', icon: <RunIcon /> },
  { key: 'Triatlón', label: 'Triatlón', icon: <TriIcon /> },
  { key: 'Ciclismo', label: 'Ciclismo', icon: <BikeIcon /> },
]

const DISTANCES: SegOption<MatchPreferences['distanceBucket']>[] = [
  { key: 'Corta', label: 'Corta', hint: '<15K' },
  { key: 'Media', label: 'Media', hint: '15–30K' },
  { key: 'Larga', label: 'Larga', hint: '30–60K' },
  { key: 'Ultra', label: 'Ultra', hint: '60K+' },
]

const TERRAINS: SegOption<Terrain>[] = [
  { key: 'Urbano', label: 'Urbano', icon: <BuildingIcon /> },
  { key: 'Montaña', label: 'Montaña', icon: <MountainIcon /> },
  { key: 'Agua', label: 'Agua', icon: <WaveIcon /> },
]

const LEVELS: SegOption<Exigencia>[] = [
  { key: 'Principiante', label: 'Principiante', bars: 1, icon: <BarsIcon active={1} /> },
  { key: 'Intermedio', label: 'Intermedio', bars: 2, icon: <BarsIcon active={2} /> },
  { key: 'Avanzado', label: 'Avanzado', bars: 3, icon: <BarsIcon active={3} /> },
]

const BREAKDOWN_LABELS = ['Distancia', 'Terreno', 'Clima', 'Exigencia'] as const

export function MatchConsole({ events }: { events: EventRow[] }) {
  const router = useRouter()
  const [pref, setPref] = useState<MatchPreferences>({
    sport: 'Running',
    distanceBucket: 'Media',
    terrain: 'Urbano',
    exigencia: 'Intermedio',
    climateIdeal: 16,
  })

  const ranked = useMemo(() => computeMatch(events, pref), [events, pref])
  const top = ranked[0]

  if (!top) {
    return (
      <div className="console-shell">
        <div>
          <h3>Encuentra tu match</h3>
          <p className="sub">Todavía no hay competencias publicadas para {pref.sport.toLowerCase()}.</p>
        </div>
      </div>
    )
  }

  const breakdown = [
    {
      label: BREAKDOWN_LABELS[0],
      weight: MATCH_WEIGHTS.distance,
      earned: top.distOk ? 1 : 0,
      detail: `${distanceBucket(top.event.km)} (${top.event.km}K) vs. objetivo ${pref.distanceBucket}`,
    },
    {
      label: BREAKDOWN_LABELS[1],
      weight: MATCH_WEIGHTS.terrain,
      earned: top.terrainOk ? 1 : 0,
      detail: `${top.event.terrain} vs. preferido ${pref.terrain}`,
    },
    {
      label: BREAKDOWN_LABELS[2],
      weight: MATCH_WEIGHTS.climate,
      earned: top.climateFrac,
      detail: `${top.event.temp_avg_c}°C en el evento vs. ${pref.climateIdeal}°C ideal`,
    },
    {
      label: BREAKDOWN_LABELS[3],
      weight: MATCH_WEIGHTS.level,
      earned: top.levelOk ? 1 : 0,
      detail: `Nivel ${top.event.exigencia} vs. buscado ${pref.exigencia}`,
    },
  ]

  return (
    <div className="console-shell">
      <div>
        <h3>Encuentra tu match</h3>
        <p className="sub">
          Primero el deporte —running, triatlón y ciclismo no se comparan entre sí— y luego distancia, terreno,
          clima y exigencia dentro de esa disciplina.
        </p>

        <div className="crow">
          <span className="clabel">1 · Tu deporte</span>
          <Seg options={SPORTS} value={pref.sport} onChange={(sport) => setPref((p) => ({ ...p, sport }))} />
        </div>
        <div className="crow">
          <span className="clabel">2 · Distancia objetivo</span>
          <Seg
            options={DISTANCES}
            value={pref.distanceBucket}
            onChange={(distanceBucket) => setPref((p) => ({ ...p, distanceBucket }))}
          />
        </div>
        <div className="crow">
          <span className="clabel">3 · Terreno</span>
          <Seg options={TERRAINS} value={pref.terrain} onChange={(terrain) => setPref((p) => ({ ...p, terrain }))} />
        </div>
        <div className="crow">
          <span className="clabel">4 · Nivel de exigencia</span>
          <Seg options={LEVELS} value={pref.exigencia} onChange={(exigencia) => setPref((p) => ({ ...p, exigencia }))} />
        </div>
        <div className="crow">
          <span className="clabel">5 · Clima ideal</span>
          <ClimateSlider value={pref.climateIdeal} onChange={(climateIdeal) => setPref((p) => ({ ...p, climateIdeal }))} />
        </div>

        <div className="match-result">
          <Ring score={top.matchScore} size={64} stroke={6} />
          <div className="match-info">
            <div className="match-status">Tu mejor match en {pref.sport.toLowerCase()}</div>
            <div className="match-name">{top.event.name}</div>
            <div className="match-meta">
              {top.event.city} · {new Date(top.event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })} · {ranked.length} eventos evaluados
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => router.push(`/eventos/${top.event.slug}`)}>
            Ver carrera
          </button>
        </div>
      </div>

      <div className="breakdown">
        <div className="breakdown-title">Por qué te sirve — {pref.sport}</div>
        {breakdown.map((b) => (
          <div className="brow" key={b.label}>
            <div className="brow-top">
              <span className="k">{b.label}</span>
              <span className="w">{b.weight}%</span>
            </div>
            <div className="brow-track">
              <div className="brow-fill" style={{ width: `${Math.round(b.earned * 100)}%` }} />
            </div>
            <div className="brow-detail">{b.detail}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
