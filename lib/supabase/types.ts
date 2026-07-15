// Tipos generados a mano a partir del schema de Supabase (schema.sql).
// Cuando el equipo crezca, esto se puede reemplazar por tipos generados
// automáticamente con: npx supabase gen types typescript --project-id cmqvpkgmsmuqotlwupjo

export type Discipline = 'Running' | 'Triatlón' | 'Ciclismo'
export type Terrain = 'Urbano' | 'Montaña' | 'Agua'
export type Exigencia = 'Principiante' | 'Intermedio' | 'Avanzado'
export type CutoffPressure = 'Generoso' | 'Moderado' | 'Estricto'
export type WaterType = 'Mar' | 'Lago' | 'Río' | 'Laguna'

export interface EventRow {
  id: string
  slug: string
  name: string
  discipline: Discipline
  city: string
  region: string
  event_date: string // ISO date
  km: number
  terrain: Terrain
  water_type: WaterType | null
  lat: number | null
  lng: number | null
  temp_avg_c: number | null
  humidity_pct: number | null
  elevation_gain_m: number | null
  altitude_m: number | null
  difficulty: number | null
  exigencia: Exigencia // columna calculada, solo lectura
  surface: string | null
  circuit_type: string | null
  distances: string[] | null
  price_clp: number
  entrants: number | null
  rating: number | null
  blurb: string | null
  image_url: string | null
  score: number | null
  projected_time: string | null
  pr_probability: number | null
  compatibility: number | null
  position_label: string | null
  climate_fit: number | null
  terrain_fit: number | null
  altitude_fit: number | null
  landscape_rating: number | null
  competitive_level: string | null
  travel_mode: string
  travel_min_clp: number
  travel_max_clp: number
  lodging_label: string
  lodging_min_clp: number
  lodging_max_clp: number
  kit_includes: string[] | null
  cutoff_pressure: CutoffPressure
  stats_estimated: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface FavoriteRow {
  user_id: string
  event_id: string
  created_at: string
}

export interface ComparisonRow {
  user_id: string
  event_id: string
  added_at: string
}

export interface MatchPreferencesRow {
  user_id: string
  sport: Discipline | null
  distance_bucket: string | null
  terrain: Terrain | null
  exigencia: Exigencia | null
  climate_ideal_c: number | null
  updated_at: string
}

// Shape mínimo que espera el cliente supabase-js tipado.
// Alcanza con esto para autocompletado en .from('events').select(...), etc.
// IMPORTANTE: tiene que ser `type`, no `interface` — postgrest-js necesita
// sintetizar un índice implícito al chequear el genérico contra GenericSchema,
// y eso no funciona de forma confiable con `interface`.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13'
  }
  public: {
    Tables: {
      events: {
        Row: EventRow
        Insert: Partial<EventRow> & Pick<EventRow, 'slug' | 'name' | 'discipline' | 'city' | 'region' | 'event_date' | 'km' | 'terrain'>
        Update: Partial<EventRow>
        Relationships: []
      }
      favorites: {
        Row: FavoriteRow
        Insert: FavoriteRow
        Update: Partial<FavoriteRow>
        Relationships: []
      }
      comparisons: {
        Row: ComparisonRow
        Insert: ComparisonRow
        Update: Partial<ComparisonRow>
        Relationships: []
      }
      match_preferences: {
        Row: MatchPreferencesRow
        Insert: Partial<MatchPreferencesRow> & Pick<MatchPreferencesRow, 'user_id'>
        Update: Partial<MatchPreferencesRow>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
