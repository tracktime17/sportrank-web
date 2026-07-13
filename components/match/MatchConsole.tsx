'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TileSelect } from '@/components/ui/TileSelect'
import type { SegOption } from '@/components/ui/Seg'
import { ClimateSlider } from '@/components/ui/ClimateSlider'
import { Ring } from '@/components/ui/Ring'
import {
  BarsIcon,
  RunIcon,
  TriIcon,
  BikeIcon,
  BuildingIcon,
  MountainIcon,
  WaveIcon,
  RulerIcon,
  CoinIcon,
  ThermoIcon,
} from '@/components/ui/Icons'
import {
  computeMatch,
  distanceLabel,
  elevationBucket,
  costBucket,
  costRange,
  costLabel,
  terrainAvailable,
  DISTANCE_OPTIONS,
  defaultDistanceFor,
  TERRAIN_OPTIONS,
  defaultTerrainFor,
  MATCH_WEIGHTS,
  type MatchPreferences,
} from '@/lib/events'
import type { Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

const SPORTS: SegOption<Discipline>[] = [
  { key: 'Running', label: 'Running', icon: <RunIcon /> },
  { key: 'Triatlón', label: 'Triatlón', icon: <TriIcon /> },
  { key: 'Ciclismo', label: 'Ciclismo', icon: <BikeIcon /> },
]

const TERRAIN_META: Record<Terrain, { icon: SegOption<Terrain>['icon'] }> = {
  Urbano: { icon: <BuildingIcon /> },
  Montaña: { icon: <MountainIcon /> },
  Agua: { icon: <WaveIcon /> },
}

const LEVELS: SegOption<Exigencia>[] = [
  { key: 'Principiante', label: 'Principiante', icon: <BarsIcon active={1} /> },
  { key: 'Intermedio', label: 'Intermedio', icon: <BarsIcon active={2} /> },
  { key: 'Avanzado', label: 'Avanzado', icon: <BarsIcon active={3} /> },
]

const ELEVATIONS: SegOption<MatchPreferences['elevationBucket']>[] = [
  { key: 'Llano', label: 'Llano' },
  { key: 'Ondulado', label: 'Ondulado' },
  { key: 'Montañoso', label: 'Montañoso' },
]

const BUDGETS: SegOption<MatchPreferences['costBucket']>[] = [
  { key: 'Bajo', label: 'Bajo' },
  { key: 'Medio', label: 'Medio' },
  { key: 'Alto', label: 'Alto' },
]

export function MatchConsole({ events }: { events: EventRow[] }) {
  const router = useRouter()
  const [pref, setPref] = useState<MatchPreferences>({
    sport: 'Running',
    distance: defaultDistanceFor('Running'),
    terrain: defaultTerrainFor('Running'),
    exigencia: 'Intermedio',
    climateIdeal: 16,
    elevationBucket: 'Ondulado',
    costBucket: 'Medio',
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

  const noTerrainForSport = !terrainAvailable(events, pref.sport, pref.terrain)
  const eventElevation = top.event.elevation_gain_m ?? 0
  const eventCost = costRange(top.event).max
  const eventDistances = distanceLabel(pref.sport, top.event)
  const terrainOptions: SegOption<Terrain>[] = TERRAIN_OPTIONS[pref.sport].map((t) => ({
    key: t,
    label: t,
    icon: TERRAIN_META[t].icon,
  }))

  const breakdown = [
    {
      label: 'Distancia',
      weight: MATCH_WEIGHTS.distance,
      earned: top.distFrac,
      icon: <RulerIcon />,
      detail:
        top.distFrac === 1
          ? `Coincide: ofrece ${eventDistances}`
          : `Ofrece ${eventDistances}, buscabas ${pref.distance}`,
    },
    {
      label: 'Terreno',
      weight: MATCH_WEIGHTS.terrain,
      earned: top.terrainOk ? 1 : 0,
      icon: TERRAIN_META[top.event.terrain].icon,
      detail: noTerrainForSport
        ? `Todavía no tenemos carreras de ${pref.terrain} en ${pref.sport.toLowerCase()}`
        : top.terrainOk
          ? `Coincide: ${top.event.terrain}`
          : `Es ${top.event.terrain}, buscabas ${pref.terrain}`,
    },
    {
      label: 'Costo',
      weight: MATCH_WEIGHTS.cost,
      earned: top.costFrac,
      icon: <CoinIcon />,
      detail:
        top.costFrac === 1
          ? `Coincide: ${costBucket(pref.sport, eventCost)} (${costLabel(top.event)} estimado)`
          : `Es ${costBucket(pref.sport, eventCost)} (${costLabel(top.event)} estimado), buscabas ${pref.costBucket}`,
    },
    {
      label: 'Exigencia',
      weight: MATCH_WEIGHTS.level,
      earned: top.levelFrac,
      icon: <BarsIcon active={3} />,
      detail:
        top.levelFrac === 1
          ? `Coincide: nivel ${top.event.exigencia}`
          : `Es ${top.event.exigencia}, buscabas ${pref.exigencia}`,
    },
    {
      label: 'Desnivel',
      weight: MATCH_WEIGHTS.elevation,
      earned: top.elevationFrac,
      icon: <MountainIcon />,
      detail:
        top.elevationFrac === 1
          ? `Coincide: ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m)`
          : `Es ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m), buscabas ${pref.elevationBucket}`,
    },
    {
      label: 'Clima',
      weight: MATCH_WEIGHTS.climate,
      earned: top.climateFrac,
      icon: <ThermoIcon />,
      detail: `${top.event.temp_avg_c}°C en el evento, ideal ${pref.climateIdeal}°C`,
    },
  ]

  const tier = (frac: number) => (frac >= 0.75 ? 'good' : frac >= 0.4 ? 'warn' : 'bad')
  const scoreTier = tier(top.matchScore / 100)
  const scoreTierLabel = { good: 'Match fuerte', warn: 'Match parcial', bad: 'Match débil' }[scoreTier]

  const strongCount = breakdown.filter((b) => b.earned >= 0.75).length
  const weakest = [...breakdown].sort((a, b) => a.earned - b.earned)[0]
  const summary =
    strongCount === breakdown.length
      ? `Los ${breakdown.length} criterios calzan casi perfecto con tu perfil.`
      : `${strongCount} de ${breakdown.length} criterios calzan perfecto. En ${weakest.label.toLowerCase()}: ${weakest.detail}.`

  return (
    <div className="console-shell">
      <div>
        <div className="console-head">
          <div>
            <h3>Encuentra tu match</h3>
            <p className="sub">
              Define tu perfil —rendimiento, recorrido, clima, desnivel y costo— y te mostramos un informe de
              compatibilidad contra las carreras publicadas: no solo un puntaje, sino en qué se ajusta y en qué no.
            </p>
          </div>
          <div className="console-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {events.length} carreras evaluadas
          </div>
        </div>

        <div className="rail-block">
          <span className="clabel">Deporte</span>
          <TileSelect
            options={SPORTS}
            value={pref.sport}
            onChange={(sport) =>
              setPref((p) => ({ ...p, sport, distance: defaultDistanceFor(sport), terrain: defaultTerrainFor(sport) }))
            }
          />
        </div>
        <div className="rail-block">
          <span className="clabel">Distancia {pref.sport === 'Triatlón' ? '(formato)' : null}</span>
          <TileSelect
            options={DISTANCE_OPTIONS[pref.sport]}
            value={pref.distance}
            onChange={(distance) => setPref((p) => ({ ...p, distance }))}
          />
        </div>
        <div className="rail-pair">
          <div>
            <span className="clabel">Terreno</span>
            <TileSelect options={terrainOptions} value={pref.terrain} onChange={(terrain) => setPref((p) => ({ ...p, terrain }))} />
          </div>
          <div>
            <span className="clabel">Exigencia</span>
            <TileSelect options={LEVELS} value={pref.exigencia} onChange={(exigencia) => setPref((p) => ({ ...p, exigencia }))} />
          </div>
        </div>
        <div className="rail-pair">
          <div>
            <span className="clabel">Desnivel</span>
            <TileSelect
              options={ELEVATIONS}
              value={pref.elevationBucket}
              onChange={(elevationBucket) => setPref((p) => ({ ...p, elevationBucket }))}
            />
          </div>
          <div>
            <span className="clabel">Costo</span>
            <TileSelect options={BUDGETS} value={pref.costBucket} onChange={(costBucket) => setPref((p) => ({ ...p, costBucket }))} />
          </div>
        </div>
        <div className="rail-block" style={{ marginBottom: 0 }}>
          <span className="clabel">Clima ideal</span>
          <ClimateSlider value={pref.climateIdeal} onChange={(climateIdeal) => setPref((p) => ({ ...p, climateIdeal }))} />
        </div>
      </div>

      <div className="report-card">
        <div className="report-eyebrow">Informe de compatibilidad</div>
        <div className="report-title">Tu perfil vs. {top.event.name}</div>

        <div className="stat-grid">
          {breakdown.map((b) => {
            const t = tier(b.earned)
            return (
              <div className={`stat-tile tone-${t}`} key={b.label}>
                <div className="stat-tile-icon">{b.icon}</div>
                <div className="stat-tile-value">{Math.round(b.earned * 100)}%</div>
                <div className="stat-tile-label">{b.label}</div>
              </div>
            )
          })}
        </div>
        <p className="report-summary">{summary}</p>

        <div className="report-footer">
          <Ring score={top.matchScore} size={56} stroke={5} className={`ring-tone-${scoreTier}`} />
          <div className="report-footer-info">
            <div className="name">
              {top.event.name} <span className={`tag tag-${scoreTier}`}>{scoreTierLabel}</span>
            </div>
            <div className="meta">
              {top.event.city} · {new Date(top.event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
              {ranked.length} eventos evaluados
            </div>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => router.push(`/eventos/${top.event.slug}`)}>
            Ver carrera
          </button>
        </div>
      </div>
    </div>
  )
}
