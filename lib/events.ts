import type { Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

// Funciones puras, sin ningún import de Supabase server / next/headers.
// Se pueden usar tanto desde Server Components como desde Client Components
// (MatchConsole, EventCard, CompareTable la importan directo). Los fetchers
// reales a la base de datos viven en lib/events-server.ts.

/* =========================================================
   MOTOR DE MATCH — mismo criterio que el prototipo:
   primero el deporte (no se mezcla running con triatlón),
   luego distancia / terreno / clima / exigencia dentro de
   esa disciplina. Pesos: 30 / 25 / 20 / 25.
========================================================= */
export const MATCH_WEIGHTS = { distance: 30, terrain: 25, climate: 20, level: 25 } as const

export interface MatchPreferences {
  sport: Discipline
  distanceBucket: 'Corta' | 'Media' | 'Larga' | 'Ultra'
  terrain: Terrain
  exigencia: Exigencia
  climateIdeal: number
}

export function distanceBucket(km: number): MatchPreferences['distanceBucket'] {
  if (km < 15) return 'Corta'
  if (km < 30) return 'Media'
  if (km < 60) return 'Larga'
  return 'Ultra'
}

export interface MatchResult {
  event: EventRow
  matchScore: number
  distOk: boolean
  terrainOk: boolean
  levelOk: boolean
  climateFrac: number
}

export function computeMatch(events: EventRow[], pref: MatchPreferences): MatchResult[] {
  return events
    .filter((e) => e.discipline === pref.sport)
    .map((e) => {
      const distOk = distanceBucket(e.km) === pref.distanceBucket
      const terrainOk = e.terrain === pref.terrain
      const levelOk = e.exigencia === pref.exigencia
      const climateDiff = Math.abs((e.temp_avg_c ?? pref.climateIdeal) - pref.climateIdeal)
      const climateFrac = Math.max(0, 1 - Math.min(1, climateDiff / 15))

      const raw =
        (distOk ? MATCH_WEIGHTS.distance : 0) +
        (terrainOk ? MATCH_WEIGHTS.terrain : 0) +
        climateFrac * MATCH_WEIGHTS.climate +
        (levelOk ? MATCH_WEIGHTS.level : 0)

      return {
        event: e,
        matchScore: Math.max(8, Math.round(raw)),
        distOk,
        terrainOk,
        levelOk,
        climateFrac,
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
