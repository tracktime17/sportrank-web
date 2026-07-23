import type { Booking, RoutePoint, VerificationFlag, VerificationResult } from './types'

const EARTH_RADIUS_M = 6371000

export function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function totalDistanceMeters(route: RoutePoint[]) {
  let total = 0
  for (let i = 1; i < route.length; i++) {
    total += haversineMeters(route[i - 1], route[i])
  }
  return total
}

export function maxSpeedKmh(route: RoutePoint[]) {
  let max = 0
  for (let i = 1; i < route.length; i++) {
    const meters = haversineMeters(route[i - 1], route[i])
    const seconds = (route[i].t - route[i - 1].t) / 1000
    if (seconds <= 0) continue
    const kmh = (meters / seconds) * 3.6
    if (kmh > max) max = kmh
  }
  return max
}

export function maxGapMinutes(route: RoutePoint[]) {
  let max = 0
  for (let i = 1; i < route.length; i++) {
    const minutes = (route[i].t - route[i - 1].t) / 60000
    if (minutes > max) max = minutes
  }
  return max
}

export function fmtMinutes(minutes: number) {
  if (minutes < 1) return '<1 min'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m}min` : `${m} min`
}

export function fmtDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

// Ritmo mínimo plausible para un paseo real (el perro para a olfatear, se
// sienta, etc.), bastante más lento que caminata humana normal. Sirve como
// piso para detectar "paseos" donde casi no hubo desplazamiento.
const MIN_PLAUSIBLE_M_PER_MIN = 35

/**
 * Calcula el resultado de verificación comparando lo que efectivamente
 * ocurrió (ruta GPS, fotos, duración real) contra lo acordado. Cada señal es
 * explicable — el dueño ve exactamente por qué un paseo quedó marcado como
 * "revisar" en vez de un puntaje opaco.
 */
export function computeVerification(booking: Pick<Booking, 'expectedMinutes' | 'session'>): VerificationResult {
  const { session, expectedMinutes } = booking
  const route = session.route
  const distanceM = totalDistanceMeters(route)
  const actualMinutes = session.startedAt && session.endedAt ? (session.endedAt - session.startedAt) / 60000 : 0
  const maxSpeed = maxSpeedKmh(route)
  const gapMinutes = maxGapMinutes(route)
  const durationRatio = expectedMinutes > 0 ? actualMinutes / expectedMinutes : 0
  const expectedMinDistance = expectedMinutes * MIN_PLAUSIBLE_M_PER_MIN

  const flags: VerificationFlag[] = []
  let score = 100

  if (!session.startPhoto) {
    flags.push({ level: 'bad', message: 'Falta la foto de inicio del paseo.' })
    score -= 25
  }
  if (!session.endPhoto) {
    flags.push({ level: 'bad', message: 'Falta la foto de término del paseo.' })
    score -= 25
  }

  if (durationRatio < 0.7) {
    flags.push({
      level: 'bad',
      message: `El paseo duró ${fmtMinutes(actualMinutes)}, bastante menos que los ${expectedMinutes} min acordados.`,
    })
    score -= 25
  } else if (durationRatio < 0.9) {
    flags.push({
      level: 'warn',
      message: `El paseo duró ${fmtMinutes(actualMinutes)}, un poco menos que los ${expectedMinutes} min acordados.`,
    })
    score -= 10
  }

  if (distanceM < expectedMinDistance * 0.5) {
    flags.push({ level: 'bad', message: 'Hubo muy poco desplazamiento — el perro casi no se movió durante el paseo.' })
    score -= 25
  } else if (distanceM < expectedMinDistance * 0.85) {
    flags.push({ level: 'warn', message: 'El desplazamiento fue más bajo de lo esperado para la duración acordada.' })
    score -= 10
  }

  if (maxSpeed > 25) {
    flags.push({
      level: 'warn',
      message: 'Se detectaron tramos a velocidad de vehículo, no de caminata — revisa la ruta.',
    })
    score -= 15
  }

  const expectedPoints = Math.max(2, Math.floor(expectedMinutes / 2))
  if (route.length < expectedPoints) {
    flags.push({ level: 'warn', message: 'Se registraron pocos puntos GPS — es posible que la app se haya cerrado durante el paseo.' })
    score -= 10
  }

  if (gapMinutes > 8) {
    flags.push({ level: 'warn', message: `Hubo un corte de ${fmtMinutes(gapMinutes)} sin señal GPS durante el paseo.` })
    score -= 10
  }

  if (flags.length === 0) {
    flags.push({ level: 'ok', message: 'Duración, ruta y fotos consistentes con el paseo acordado.' })
  }

  score = Math.max(0, Math.min(100, score))
  const status = score >= 80 ? 'verificado' : score >= 50 ? 'revisar' : 'no_verificado'

  return {
    score,
    status,
    flags,
    actualMinutes,
    distanceM,
    avgPaceMinPerKm: distanceM > 0 ? actualMinutes / (distanceM / 1000) : null,
    maxSpeedKmh: maxSpeed,
    pointCount: route.length,
    maxGapMinutes: gapMinutes,
  }
}

/** Genera una ruta sintética (loop de barrio) para mostrar un ejemplo de reporte sin tener que caminar de verdad. */
export function generateDemoRoute(center: { lat: number; lng: number }, startTime: number, minutes: number): RoutePoint[] {
  const points: RoutePoint[] = []
  const steps = minutes * 12 // ~1 punto cada 5s
  const radius = 0.0009 + minutes * 0.00002
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const wobble = Math.sin(i * 1.7) * 0.00006
    points.push({
      lat: center.lat + Math.sin(angle) * radius + wobble,
      lng: center.lng + Math.cos(angle) * radius * 1.3 + wobble,
      t: startTime + i * 5000,
      accuracy: 8 + Math.round(Math.random() * 6),
    })
  }
  return points
}
