import type { Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

// Funciones puras, sin ningún import de Supabase server / next/headers.
// Se pueden usar tanto desde Server Components como desde Client Components
// (MatchConsole, EventCard, CompareTable la importan directo). Los fetchers
// reales a la base de datos viven en lib/events-server.ts.

/* =========================================================
   MOTOR DE MATCH — primero el deporte (no se mezcla running
   con triatlón), luego distancia / terreno / clima / exigencia
   / desnivel / costo dentro de esa disciplina.

   La distancia, el desnivel y el costo NO se miden igual en los
   3 deportes (un runner piensa en 5K/10K/21K/42K, un triatleta en
   Sprint/Olímpico/70.3/140.6, y lo que es "montañoso" para un
   corredor es apenas ondulado para un ciclista) — por eso cada
   deporte tiene su propio vocabulario y sus propios umbrales en
   vez de un solo bucket genérico aplicado a los 3 por igual.
========================================================= */
export const MATCH_WEIGHTS = { distance: 20, terrain: 15, climate: 15, level: 15, elevation: 15, cost: 20 } as const

export type ElevationBucket = 'Llano' | 'Ondulado' | 'Montañoso'
export type CostBucket = 'Bajo' | 'Medio' | 'Alto'

export interface MatchPreferences {
  sport: Discipline
  distance: string
  terrain: Terrain
  exigencia: Exigencia
  climateIdeal: number
  elevationBucket: ElevationBucket
  costBucket: CostBucket
}

const STEP_FRAC_4 = [1, 0.55, 0.2, 0] // 0, 1, 2, 3 escalones de distancia
const LEVEL_ORDER: Exigencia[] = ['Principiante', 'Intermedio', 'Avanzado']
const LEVEL_STEP_FRAC = [1, 0.5, 0]
const ELEVATION_STEP_FRAC = [1, 0.4, 0]
const COST_STEP_FRAC = [1, 0.4, 0]

function stepFrac<T>(order: T[], steps: number[], a: T, b: T) {
  const diff = Math.abs(order.indexOf(a) - order.indexOf(b))
  return steps[diff] ?? 0
}

/* ---------- distancia: vocabulario real por deporte ---------- */
export const DISTANCE_OPTIONS: Record<Discipline, { key: string; label: string; hint?: string }[]> = {
  Running: [
    { key: '5K', label: '5K' },
    { key: '10K', label: '10K' },
    { key: '21K', label: '21K', hint: 'Media maratón' },
    { key: '42K', label: '42K', hint: 'Maratón' },
  ],
  Triatlón: [
    { key: 'Sprint', label: 'Sprint', hint: '~25K total' },
    { key: 'Olímpico', label: 'Olímpico', hint: '~52K total' },
    { key: '70.3', label: '70.3', hint: 'Half' },
    { key: '140.6', label: '140.6', hint: 'Full' },
  ],
  Ciclismo: [
    { key: 'Corta', label: 'Corta', hint: '<30K' },
    { key: 'Media', label: 'Media', hint: '30–60K' },
    { key: 'Larga', label: 'Larga', hint: '60–100K' },
    { key: 'Fondo', label: 'Fondo', hint: '100K+' },
  ],
}

export function defaultDistanceFor(sport: Discipline) {
  return DISTANCE_OPTIONS[sport][1].key
}

function normalizeRunningTag(raw: string) {
  return DISTANCE_OPTIONS.Running.some((o) => o.key === raw) ? raw : null
}

function normalizeTriTag(raw: string) {
  const s = raw.toLowerCase()
  if (s.includes('sprint')) return 'Sprint'
  if (s.includes('olímpico') || s.includes('olimpico') || s.includes('5150')) return 'Olímpico'
  if (s.includes('140.6') || s.includes('140,6')) return '140.6'
  if (s.includes('70.3') || s.includes('70,3')) return '70.3'
  return null
}

function parseKm(raw: string) {
  const m = raw.match(/^(\d+(?:[.,]\d+)?)\s*K$/i)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

function classifyCyclingKm(km: number) {
  if (km < 30) return 'Corta'
  if (km < 60) return 'Media'
  if (km < 100) return 'Larga'
  return 'Fondo'
}

/** Las distancias que ofrece el evento ese día, normalizadas al vocabulario del deporte (una maratón con 10K/21K/42K son 3 opciones, no una). */
function eventDistanceTags(sport: Discipline, event: EventRow): string[] {
  const raw = event.distances && event.distances.length > 0 ? event.distances : [`${event.km}K`]
  const tags =
    sport === 'Running'
      ? raw.map(normalizeRunningTag)
      : sport === 'Triatlón'
        ? raw.map(normalizeTriTag)
        : raw.map(parseKm).map((km) => (km === null ? null : classifyCyclingKm(km)))
  return [...new Set(tags.filter((t): t is string => t !== null))]
}

/** Mejor coincidencia de distancia: si el evento ofrece varias, se usa la más cercana a lo que pediste. */
export function distanceFrac(sport: Discipline, event: EventRow, wanted: string): number {
  const order = DISTANCE_OPTIONS[sport].map((o) => o.key)
  const wantedIdx = order.indexOf(wanted)
  const tags = eventDistanceTags(sport, event)
  if (tags.length === 0) return 0
  return Math.max(
    ...tags.map((t) => {
      const idx = order.indexOf(t)
      return idx === -1 ? 0 : (STEP_FRAC_4[Math.abs(idx - wantedIdx)] ?? 0)
    })
  )
}

export function distanceLabel(sport: Discipline, event: EventRow): string {
  const tags = eventDistanceTags(sport, event)
  return tags.length > 0 ? tags.join(' / ') : `${event.km}K`
}

/* ---------- desnivel y costo: mismas 3 etiquetas, umbrales por deporte ---------- */
interface Scale<T extends string> {
  order: T[]
  breakpoints: number[] // límites superiores; el último tramo queda abierto
}

function bucketIndex(value: number, breakpoints: number[]) {
  for (let i = 0; i < breakpoints.length; i++) {
    if (value < breakpoints[i]) return i
  }
  return breakpoints.length
}

const ELEVATION_SCALES: Record<Discipline, Scale<ElevationBucket>> = {
  Running: { order: ['Llano', 'Ondulado', 'Montañoso'], breakpoints: [65, 100] },
  Triatlón: { order: ['Llano', 'Ondulado', 'Montañoso'], breakpoints: [300, 1000] },
  Ciclismo: { order: ['Llano', 'Ondulado', 'Montañoso'], breakpoints: [900, 1700] },
}

const COST_SCALES: Record<Discipline, Scale<CostBucket>> = {
  Running: { order: ['Bajo', 'Medio', 'Alto'], breakpoints: [35_000, 48_000] },
  Triatlón: { order: ['Bajo', 'Medio', 'Alto'], breakpoints: [300_000, 420_000] },
  Ciclismo: { order: ['Bajo', 'Medio', 'Alto'], breakpoints: [80_000, 200_000] },
}

export function elevationBucket(sport: Discipline, m: number): ElevationBucket {
  const scale = ELEVATION_SCALES[sport]
  return scale.order[bucketIndex(m, scale.breakpoints)]
}

export function costBucket(sport: Discipline, total: number): CostBucket {
  const scale = COST_SCALES[sport]
  return scale.order[bucketIndex(total, scale.breakpoints)]
}

export interface MatchResult {
  event: EventRow
  matchScore: number
  distFrac: number
  terrainOk: boolean
  levelFrac: number
  climateFrac: number
  elevationFrac: number
  costFrac: number
}

/** ¿Hay al menos un evento de este deporte con el terreno pedido? Si no, mostramos un mensaje honesto en vez de un 0% que parece un bug. */
export function terrainAvailable(events: EventRow[], sport: Discipline, terrain: Terrain) {
  return events.some((e) => e.discipline === sport && e.terrain === terrain)
}

export function computeMatch(events: EventRow[], pref: MatchPreferences): MatchResult[] {
  return events
    .filter((e) => e.discipline === pref.sport)
    .map((e) => {
      const distFrac = distanceFrac(pref.sport, e, pref.distance)
      const terrainOk = e.terrain === pref.terrain
      const levelFrac = stepFrac(LEVEL_ORDER, LEVEL_STEP_FRAC, e.exigencia, pref.exigencia)
      const climateDiff = Math.abs((e.temp_avg_c ?? pref.climateIdeal) - pref.climateIdeal)
      const climateFrac = Math.max(0, 1 - Math.min(1, climateDiff / 15))
      const elevationFrac = stepFrac(
        ELEVATION_SCALES[pref.sport].order,
        ELEVATION_STEP_FRAC,
        elevationBucket(pref.sport, e.elevation_gain_m ?? 0),
        pref.elevationBucket
      )
      const costFrac = stepFrac(
        COST_SCALES[pref.sport].order,
        COST_STEP_FRAC,
        costBucket(pref.sport, costRange(e).max),
        pref.costBucket
      )

      const raw =
        distFrac * MATCH_WEIGHTS.distance +
        (terrainOk ? MATCH_WEIGHTS.terrain : 0) +
        climateFrac * MATCH_WEIGHTS.climate +
        levelFrac * MATCH_WEIGHTS.level +
        elevationFrac * MATCH_WEIGHTS.elevation +
        costFrac * MATCH_WEIGHTS.cost

      return {
        event: e,
        matchScore: Math.max(8, Math.round(raw)),
        distFrac,
        terrainOk,
        levelFrac,
        climateFrac,
        elevationFrac,
        costFrac,
      }
    })
    .sort((a, b) => b.matchScore - a.matchScore)
}

/* =========================================================
   COSTO TOTAL — capa separada del match deportivo.
========================================================= */
export function costRange(e: EventRow) {
  return {
    min: e.price_clp + e.travel_min_clp + e.lodging_min_clp,
    max: e.price_clp + e.travel_max_clp + e.lodging_max_clp,
  }
}

export function fmtCLP(n: number) {
  return n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n}`
}

export function costLabel(e: EventRow) {
  const { min, max } = costRange(e)
  return min === max ? fmtCLP(min) : `${fmtCLP(min)}–${fmtCLP(max)}`
}
