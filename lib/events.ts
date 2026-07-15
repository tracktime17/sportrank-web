import type { CutoffPressure, Discipline, EventRow, Exigencia, Terrain, WaterType } from '@/lib/supabase/types'

// Funciones puras, sin ningún import de Supabase server / next/headers.
// Se pueden usar tanto desde Server Components como desde Client Components
// (MatchConsole, EventCard, CompareTable la importan directo). Los fetchers
// reales a la base de datos viven en lib/events-server.ts.

// Lanzamiento inicial enfocado en triatlón — running y ciclismo se muestran
// como "Próximamente" en toda la app hasta que se sumen más eventos reales.
export const LAUNCHED_DISCIPLINES: Discipline[] = ['Triatlón']

export function isLaunched(sport: Discipline): boolean {
  return LAUNCHED_DISCIPLINES.includes(sport)
}

/* =========================================================
   MOTOR DE MATCH — primero el deporte (no se mezcla running
   con triatlón), luego 10 criterios dentro de esa disciplina:
   distancia, terreno, clima (sensación térmica), exigencia,
   desnivel, costo, presión del tiempo de corte, temporada,
   tipo de agua (nado) y tamaño/ambiente de la carrera.

   El PESO de cada criterio depende del objetivo que elige el
   usuario (disfrutar / mejorar marca / competir) — no es el
   mismo "buen match" para alguien que quiere pasarlo bien que
   para alguien que quiere competir en serio. Ver WEIGHT_PROFILES.

   La distancia, el desnivel y el costo tampoco se miden igual en
   los 3 deportes (un runner piensa en 5K/10K/21K/42K, un triatleta
   en Sprint/Olímpico/70.3/140.6, y lo que es "montañoso" para un
   corredor es apenas ondulado para un ciclista) — por eso cada
   deporte tiene su propio vocabulario y sus propios umbrales en
   vez de un solo bucket genérico aplicado a los 3 por igual.

   Tipo de agua y tamaño de carrera son específicos de triatlón:
   el nado es lo que más ansiedad genera al elegir carrera (mar
   abierto con oleaje no es lo mismo que un lago tranquilo o un
   río con corriente), y el tamaño real de la carrera (inscritos)
   define si se siente como una fiesta masiva o algo íntimo.
========================================================= */
export type MatchGoal = 'Disfrutar' | 'Mejorar marca' | 'Competir'

export const WEIGHT_PROFILES: Record<
  MatchGoal,
  {
    distance: number
    terrain: number
    climate: number
    level: number
    elevation: number
    cost: number
    cutoff: number
    season: number
    water: number
    raceSize: number
  }
> = {
  Disfrutar: { climate: 14, cost: 13, cutoff: 13, terrain: 9, distance: 9, elevation: 6, level: 6, season: 7, water: 13, raceSize: 10 },
  'Mejorar marca': { climate: 14, elevation: 13, distance: 13, terrain: 9, level: 10, cost: 8, cutoff: 6, season: 7, water: 11, raceSize: 9 },
  Competir: { level: 18, distance: 13, terrain: 11, elevation: 10, climate: 8, cost: 6, cutoff: 5, season: 9, water: 10, raceSize: 10 },
}

export type ElevationBucket = 'Llano' | 'Ondulado' | 'Montañoso'
export type CostBucket = 'Bajo' | 'Medio' | 'Alto'
export type Season = 'Próximo mes' | 'Este semestre' | 'Sin apuro'
export type RaceSize = 'Íntima' | 'Mediana' | 'Masiva'

export interface MatchPreferences {
  goal: MatchGoal
  sport: Discipline
  distance: string
  terrain: Terrain
  exigencia: Exigencia
  climateIdeal: number
  elevationBucket: ElevationBucket
  costBucket: CostBucket
  cutoffPressure: CutoffPressure
  season: Season
  waterType: WaterType
  raceSize: RaceSize
}

const STEP_FRAC_4 = [1, 0.55, 0.2, 0] // 0, 1, 2, 3 escalones de distancia
const LEVEL_ORDER: Exigencia[] = ['Principiante', 'Intermedio', 'Avanzado']
const LEVEL_STEP_FRAC = [1, 0.5, 0]
const ELEVATION_STEP_FRAC = [1, 0.4, 0]
const COST_STEP_FRAC = [1, 0.4, 0]
const CUTOFF_ORDER: CutoffPressure[] = ['Generoso', 'Moderado', 'Estricto']
const CUTOFF_STEP_FRAC = [1, 0.45, 0]
const SEASON_ORDER: Season[] = ['Próximo mes', 'Este semestre', 'Sin apuro']
const SEASON_STEP_FRAC = [1, 0.5, 0.15]
const RACE_SIZE_ORDER: RaceSize[] = ['Íntima', 'Mediana', 'Masiva']
const RACE_SIZE_STEP_FRAC = [1, 0.4, 0]

/** Tamaño real de la carrera según inscritos — no hay dato "oficial" de qué
 * es masivo o íntimo, así que usamos umbrales consistentes con el rango
 * real de eventos que ya tenemos (de 100 cupos boutique a 35.000 corredores). */
export function raceSizeBucket(entrants: number | null): RaceSize {
  if (entrants === null) return 'Íntima'
  if (entrants < 500) return 'Íntima'
  if (entrants < 5000) return 'Mediana'
  return 'Masiva'
}

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

/* ---------- sensación térmica: temperatura ajustada por humedad ---------- */
/** Aproximación simple: sobre 20°C, la humedad alta hace que se sienta más calor (y la humedad baja, más fresco). No es un índice de calor oficial, pero capta la idea que un corredor de verdad nota. */
export function feelsLikeC(tempC: number, humidityPct: number): number {
  if (tempC < 20) return tempC
  const adjustment = ((humidityPct - 50) / 50) * (tempC - 20) * 0.15
  return Math.round((tempC + adjustment) * 10) / 10
}

/* ---------- temporada: cuánto falta para el evento ---------- */
export function seasonBucket(eventDateISO: string, now: Date = new Date()): Season {
  const days = (new Date(eventDateISO).getTime() - now.getTime()) / 86_400_000
  if (days <= 80) return 'Próximo mes'
  if (days <= 160) return 'Este semestre'
  return 'Sin apuro'
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
  cutoffFrac: number
  seasonFrac: number
  waterOk: boolean
  raceSizeFrac: number
  eventRaceSize: RaceSize
  feelsLike: number
}

/** ¿Hay al menos un evento de este deporte con el terreno pedido? Si no, mostramos un mensaje honesto en vez de un 0% que parece un bug. */
export function terrainAvailable(events: EventRow[], sport: Discipline, terrain: Terrain) {
  return events.some((e) => e.discipline === sport && e.terrain === terrain)
}

/** No se puede correr en el agua ni hacer triatlón sin nadar — el terreno posible también depende del deporte. */
export const TERRAIN_OPTIONS: Record<Discipline, Terrain[]> = {
  Running: ['Urbano', 'Montaña'],
  Triatlón: ['Agua'],
  Ciclismo: ['Urbano', 'Montaña'],
}

export function defaultTerrainFor(sport: Discipline): Terrain {
  return TERRAIN_OPTIONS[sport][0]
}

/** El tipo de agua solo aplica a triatlón — nadar es la parte que más
 * ansiedad genera al elegir carrera, y no es lo mismo mar abierto con
 * oleaje que un lago tranquilo, un río con corriente o una laguna. */
export const WATER_OPTIONS: WaterType[] = ['Mar', 'Lago', 'Río', 'Laguna']

export function defaultWaterTypeFor(): WaterType {
  return WATER_OPTIONS[0]
}

export function computeMatch(events: EventRow[], pref: MatchPreferences): MatchResult[] {
  const weights = WEIGHT_PROFILES[pref.goal]

  return events
    .filter((e) => e.discipline === pref.sport)
    .map((e) => {
      const distFrac = distanceFrac(pref.sport, e, pref.distance)
      const terrainOk = e.terrain === pref.terrain
      const levelFrac = stepFrac(LEVEL_ORDER, LEVEL_STEP_FRAC, e.exigencia, pref.exigencia)

      const feelsLike = feelsLikeC(e.temp_avg_c ?? pref.climateIdeal, e.humidity_pct ?? 50)
      const climateDiff = Math.abs(feelsLike - pref.climateIdeal)
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
      const cutoffFrac = stepFrac(CUTOFF_ORDER, CUTOFF_STEP_FRAC, e.cutoff_pressure, pref.cutoffPressure)
      const seasonFrac = stepFrac(SEASON_ORDER, SEASON_STEP_FRAC, seasonBucket(e.event_date), pref.season)
      const waterOk = e.water_type === null ? true : e.water_type === pref.waterType
      const eventRaceSize = raceSizeBucket(e.entrants)
      const raceSizeFrac = stepFrac(RACE_SIZE_ORDER, RACE_SIZE_STEP_FRAC, eventRaceSize, pref.raceSize)

      const raw =
        distFrac * weights.distance +
        (terrainOk ? weights.terrain : 0) +
        climateFrac * weights.climate +
        levelFrac * weights.level +
        elevationFrac * weights.elevation +
        costFrac * weights.cost +
        cutoffFrac * weights.cutoff +
        seasonFrac * weights.season +
        (waterOk ? weights.water : 0) +
        raceSizeFrac * weights.raceSize

      return {
        event: e,
        matchScore: Math.max(8, Math.round(raw)),
        distFrac,
        terrainOk,
        levelFrac,
        climateFrac,
        elevationFrac,
        costFrac,
        cutoffFrac,
        seasonFrac,
        waterOk,
        raceSizeFrac,
        eventRaceSize,
        feelsLike,
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

/* =========================================================
   FORMATOS REALES DE TRIATLÓN — distancias y tiempos de corte
   estandarizados y públicos de cada formato (Sprint, Olímpico,
   70.3, 140.6), no inventados por evento. Fuente: reglamento
   oficial IRONMAN (70.3 = 8h30, 140.6 = 17h, triatlonpucon.cl
   para 70.3 Pucón específico) y estándar olímpico/sprint.
========================================================= */
export interface TriLegSplit {
  swimKm: number
  bikeKm: number
  runKm: number
}

const TRI_FORMAT_LEGS: Record<string, TriLegSplit> = {
  '140.6': { swimKm: 3.8, bikeKm: 180, runKm: 42.2 },
  '70.3': { swimKm: 1.9, bikeKm: 90, runKm: 21.1 },
  Olímpico: { swimKm: 1.5, bikeKm: 40, runKm: 10 },
  Sprint: { swimKm: 0.75, bikeKm: 20, runKm: 5 },
}

function matchTriFormat(distances: string[] | null): keyof typeof TRI_FORMAT_LEGS | null {
  if (!distances) return null
  const joined = distances.join(' ').toLowerCase()
  if (joined.includes('140.6')) return '140.6'
  if (joined.includes('70.3')) return '70.3'
  if (joined.includes('olímpico') || joined.includes('olimpico') || joined.includes('5150')) return 'Olímpico'
  if (joined.includes('sprint')) return 'Sprint'
  return null
}

export function triLegsFor(distances: string[] | null): TriLegSplit | null {
  const format = matchTriFormat(distances)
  return format ? TRI_FORMAT_LEGS[format] : null
}

export interface CutoffInfo {
  label: string
  note: string
}

const TRI_FORMAT_CUTOFFS: Record<string, CutoffInfo> = {
  '140.6': { label: '17h 00min', note: 'Estándar IRONMAN full: nado 2h20, bici 10h30, total 17h desde la salida.' },
  '70.3': { label: '8h 30min', note: 'Estándar IRONMAN 70.3: nado 1h10, bici 5h30, total 8h30 desde la salida.' },
  Olímpico: { label: '~4h 00min', note: 'Aproximado para distancia olímpica — confirma el detalle con el organizador.' },
  Sprint: { label: '~2h 00min', note: 'Aproximado para distancia sprint — confirma el detalle con el organizador.' },
}

export function cutoffInfoFor(distances: string[] | null): CutoffInfo | null {
  const format = matchTriFormat(distances)
  return format ? TRI_FORMAT_CUTOFFS[format] : null
}
