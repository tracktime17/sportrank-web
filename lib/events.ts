import type { Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

// Funciones puras, sin ningún import de Supabase server / next/headers.
// Se pueden usar tanto desde Server Components como desde Client Components
// (MatchConsole, EventCard, CompareTable la importan directo). Los fetchers
// reales a la base de datos viven en lib/events-server.ts.

/* =========================================================
   MOTOR DE MATCH — primero el deporte (no se mezcla running
   con triatlón), luego distancia / terreno / clima / exigencia
   / desnivel / costo dentro de esa disciplina. Estos 6 ejes son
   los mismos que promete la portada (rendimiento, recorrido,
   clima, desnivel, costo) — si se agrega un criterio nuevo acá,
   agrégalo también al radar de MatchConsole.
========================================================= */
export const MATCH_WEIGHTS = { distance: 20, terrain: 15, climate: 15, level: 15, elevation: 15, cost: 20 } as const

export type ElevationBucket = 'Llano' | 'Ondulado' | 'Montañoso'
export type CostBucket = 'Bajo' | 'Medio' | 'Alto'

export interface MatchPreferences {
  sport: Discipline
  distanceBucket: 'Corta' | 'Media' | 'Larga' | 'Ultra'
  terrain: Terrain
  exigencia: Exigencia
  climateIdeal: number
  elevationBucket: ElevationBucket
  costBucket: CostBucket
}

export function distanceBucket(km: number): MatchPreferences['distanceBucket'] {
  if (km < 15) return 'Corta'
  if (km < 30) return 'Media'
  if (km < 60) return 'Larga'
  return 'Ultra'
}

export function elevationBucket(m: number): ElevationBucket {
  if (m < 200) return 'Llano'
  if (m < 600) return 'Ondulado'
  return 'Montañoso'
}

export function costBucket(total: number): CostBucket {
  if (total < 120_000) return 'Bajo'
  if (total < 280_000) return 'Medio'
  return 'Alto'
}

const DISTANCE_ORDER: MatchPreferences['distanceBucket'][] = ['Corta', 'Media', 'Larga', 'Ultra']
const DISTANCE_STEP_FRAC = [1, 0.55, 0.2, 0] // 0, 1, 2, 3 buckets de distancia
const LEVEL_ORDER: Exigencia[] = ['Principiante', 'Intermedio', 'Avanzado']
const LEVEL_STEP_FRAC = [1, 0.5, 0] // 0, 1, 2 escalones de nivel
const ELEVATION_ORDER: ElevationBucket[] = ['Llano', 'Ondulado', 'Montañoso']
const ELEVATION_STEP_FRAC = [1, 0.4, 0] // 0, 1, 2 escalones de desnivel
const COST_ORDER: CostBucket[] = ['Bajo', 'Medio', 'Alto']
const COST_STEP_FRAC = [1, 0.4, 0] // 0, 1, 2 escalones de presupuesto

function stepFrac<T>(order: T[], steps: number[], a: T, b: T) {
  const diff = Math.abs(order.indexOf(a) - order.indexOf(b))
  return steps[diff] ?? 0
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
      const distFrac = stepFrac(DISTANCE_ORDER, DISTANCE_STEP_FRAC, distanceBucket(e.km), pref.distanceBucket)
      const terrainOk = e.terrain === pref.terrain
      const levelFrac = stepFrac(LEVEL_ORDER, LEVEL_STEP_FRAC, e.exigencia, pref.exigencia)
      const climateDiff = Math.abs((e.temp_avg_c ?? pref.climateIdeal) - pref.climateIdeal)
      const climateFrac = Math.max(0, 1 - Math.min(1, climateDiff / 15))
      const elevationFrac = stepFrac(
        ELEVATION_ORDER,
        ELEVATION_STEP_FRAC,
        elevationBucket(e.elevation_gain_m ?? 0),
        pref.elevationBucket
      )
      const costFrac = stepFrac(COST_ORDER, COST_STEP_FRAC, costBucket(costRange(e).max), pref.costBucket)

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
