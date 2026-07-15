'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { Ring } from '@/components/ui/Ring'
import { RulerIcon, CoinIcon, ThermoIcon, ClockIcon, CalendarIcon, BarsIcon, BuildingIcon, MountainIcon, WaveIcon } from '@/components/ui/Icons'
import { useMatchPreferences } from '@/lib/store/useMatchPreferences'
import {
  computeMatch,
  distanceLabel,
  elevationBucket,
  costBucket,
  costRange,
  costLabel,
  WEIGHT_PROFILES,
} from '@/lib/events'
import type { EventRow, Terrain } from '@/lib/supabase/types'

const TERRAIN_ICON: Record<Terrain, ReactNode> = {
  Urbano: <BuildingIcon />,
  Montaña: <MountainIcon />,
  Agua: <WaveIcon />,
}

function tier(frac: number): 'good' | 'warn' | 'bad' {
  return frac >= 0.75 ? 'good' : frac >= 0.4 ? 'warn' : 'bad'
}

const TAGLINE: Record<'good' | 'warn' | 'bad', string> = {
  good: '🔥 Este es tu momento — todo apunta a tu mejor marca.',
  warn: '💪 Buenas condiciones. Con la preparación correcta, puedes destacar acá.',
  bad: '🧭 No es tu match ideal, pero puede ser un lindo desafío.',
}

export function RealPerformancePanel({ event }: { event: EventRow }) {
  const { pref, hydrated } = useMatchPreferences()

  if (!hydrated) return <div className="perf-panel perf-panel-loading" />

  if (!pref || pref.sport !== event.discipline) {
    return (
      <div className="perf-empty">
        <div className="perf-empty-icon">🎯</div>
        <h3>Todavía no sabemos qué buscas</h3>
        <p>Responde el quiz de 1 minuto y te mostramos tu compatibilidad real con esta carrera — no un número genérico.</p>
        <Link href="/#match-section" className="btn btn-primary btn-sm">
          Responder el quiz
        </Link>
      </div>
    )
  }

  const [result] = computeMatch([event], pref)
  if (!result) return null

  const weights = WEIGHT_PROFILES[pref.goal]
  const eventElevation = event.elevation_gain_m ?? 0
  const eventCost = costRange(event).max
  const eventDistances = distanceLabel(pref.sport, event)
  const scoreTier = tier(result.matchScore / 100)

  const rows = [
    {
      label: 'Distancia',
      earned: result.distFrac,
      icon: <RulerIcon />,
      detail:
        result.distFrac === 1 ? `Coincide: ofrece ${eventDistances}` : `Ofrece ${eventDistances}, buscabas ${pref.distance}`,
    },
    {
      label: 'Terreno',
      earned: result.terrainOk ? 1 : 0,
      icon: TERRAIN_ICON[event.terrain],
      detail: result.terrainOk ? `Coincide: ${event.terrain}` : `Es ${event.terrain}, buscabas ${pref.terrain}`,
    },
    {
      label: 'Exigencia',
      earned: result.levelFrac,
      icon: <BarsIcon active={3} />,
      detail: result.levelFrac === 1 ? `Coincide: nivel ${event.exigencia}` : `Es ${event.exigencia}, buscabas ${pref.exigencia}`,
    },
    {
      label: 'Desnivel',
      earned: result.elevationFrac,
      icon: <MountainIcon />,
      detail:
        result.elevationFrac === 1
          ? `Coincide: ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m)`
          : `Es ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m), buscabas ${pref.elevationBucket}`,
    },
    {
      label: 'Clima',
      earned: result.climateFrac,
      icon: <ThermoIcon />,
      detail: `Sensación térmica ${result.feelsLike}°C (${event.temp_avg_c}°C, ${event.humidity_pct}% humedad), ideal ${pref.climateIdeal}°C`,
    },
    {
      label: 'Costo',
      earned: result.costFrac,
      icon: <CoinIcon />,
      detail:
        result.costFrac === 1
          ? `Coincide: ${costBucket(pref.sport, eventCost)} (${costLabel(event)} estimado)`
          : `Es ${costBucket(pref.sport, eventCost)} (${costLabel(event)} estimado), buscabas ${pref.costBucket}`,
    },
    {
      label: 'Tiempo de corte',
      earned: result.cutoffFrac,
      icon: <ClockIcon />,
      detail:
        result.cutoffFrac === 1
          ? `Coincide: cierre de meta ${event.cutoff_pressure.toLowerCase()}`
          : `Cierre de meta ${event.cutoff_pressure.toLowerCase()}, buscabas ${pref.cutoffPressure.toLowerCase()}`,
    },
    {
      label: 'Temporada',
      earned: result.seasonFrac,
      icon: <CalendarIcon />,
      detail:
        result.seasonFrac === 1
          ? `Coincide con lo que buscabas: ${pref.season.toLowerCase()}`
          : `Buscabas algo "${pref.season.toLowerCase()}"`,
    },
    {
      label: 'Tipo de agua',
      earned: result.waterOk ? 1 : 0,
      icon: <WaveIcon />,
      detail: event.water_type
        ? result.waterOk
          ? `Coincide: nado en ${event.water_type.toLowerCase()}`
          : `Es ${event.water_type.toLowerCase()}, buscabas ${pref.waterType.toLowerCase()}`
        : 'Todavía no tenemos el tipo de agua de esta carrera',
    },
    {
      label: 'Ambiente',
      earned: result.raceSizeFrac,
      icon: <BarsIcon active={2} />,
      detail:
        result.raceSizeFrac === 1
          ? `Coincide: carrera ${result.eventRaceSize.toLowerCase()}`
          : `Es ${result.eventRaceSize.toLowerCase()}, buscabas algo ${pref.raceSize.toLowerCase()}`,
    },
  ]

  return (
    <div className="perf-panel">
      <div>
        <Ring score={result.matchScore} size={150} stroke={12} fontSize={38} />
        <div className="ring-lbl">Tu compatibilidad real</div>
        <div className={`perf-tagline tone-${scoreTier}`}>{TAGLINE[scoreTier]}</div>
      </div>
      <div>
        <h3>Calculado con tus respuestas del quiz — no un número genérico</h3>
        <p className="perf-basis">
          Objetivo: <b>{pref.goal}</b> · Pesos usados: distancia {weights.distance}, terreno {weights.terrain}, clima{' '}
          {weights.climate}, exigencia {weights.level}, desnivel {weights.elevation}, costo {weights.cost}, corte{' '}
          {weights.cutoff}, temporada {weights.season}, agua {weights.water}, ambiente {weights.raceSize}
        </p>
        <div className="perf-rows">
          {rows.map((r) => {
            const t = tier(r.earned)
            return (
              <div className={`detail-row tone-${t}`} key={r.label}>
                <div className="detail-row-icon">{r.icon}</div>
                <div className="detail-row-body">
                  <div className="detail-row-top">
                    <span className="k">{r.label}</span>
                    <span className="v">{Math.round(r.earned * 100)}%</span>
                  </div>
                  <div className="detail-row-track">
                    <div className="detail-row-fill" style={{ width: `${Math.max(6, Math.round(r.earned * 100))}%` }} />
                  </div>
                  <div className="detail-row-detail">{r.detail}</div>
                </div>
              </div>
            )
          })}
        </div>
        <Link href="/#match-section" className="perf-edit">
          ✎ Cambiar mis respuestas del quiz
        </Link>
      </div>
    </div>
  )
}
