export type BookingStatus = 'pendiente' | 'en_curso' | 'completado' | 'cancelado'

export interface RoutePoint {
  lat: number
  lng: number
  t: number // epoch ms
  accuracy: number | null
}

export type VerificationStatus = 'verificado' | 'revisar' | 'no_verificado'

export interface VerificationFlag {
  level: 'ok' | 'warn' | 'bad'
  message: string
}

export interface VerificationResult {
  score: number
  status: VerificationStatus
  flags: VerificationFlag[]
  actualMinutes: number
  distanceM: number
  avgPaceMinPerKm: number | null
  maxSpeedKmh: number
  pointCount: number
  maxGapMinutes: number
}

export interface WalkSession {
  startedAt: number | null
  endedAt: number | null
  startPhoto: string | null
  endPhoto: string | null
  route: RoutePoint[]
  verification: VerificationResult | null
}

/** Quién está mirando este paseo, relativo a auth.uid() del que consulta. */
export type ViewerRole = 'owner' | 'walker' | 'other'

export interface Booking {
  id: string
  dogName: string
  dogBreed: string | null
  walkerName: string
  scheduledAt: string
  expectedMinutes: number
  priceClp: number | null
  status: BookingStatus
  createdAt: string
  session: WalkSession
  isDemo?: boolean
  viewerRole: ViewerRole
  /**
   * true si quien consulta es exactamente walker_id — independiente de
   * viewerRole, que prioriza "owner" cuando el dueño también se auto-asignó
   * el paseo (se camina su propio perro). La pantalla de registro en vivo
   * necesita esta señal específica, no la prioridad owner-primero.
   */
  isClaimedByMe: boolean
}
