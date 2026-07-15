'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TileSelect } from '@/components/ui/TileSelect'
import type { SegOption } from '@/components/ui/Seg'
import { ClimateSlider } from '@/components/ui/ClimateSlider'
import { useMatchPreferences } from '@/lib/store/useMatchPreferences'
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
  ClockIcon,
  CalendarIcon,
  ShareIcon,
  BackIcon,
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
  WEIGHT_PROFILES,
  type MatchGoal,
  type MatchPreferences,
} from '@/lib/events'
import type { CutoffPressure, Discipline, EventRow, Exigencia, Terrain } from '@/lib/supabase/types'

const GOALS: SegOption<MatchGoal>[] = [
  { key: 'Disfrutar', label: 'Disfrutar', icon: <span>🙂</span> },
  { key: 'Mejorar marca', label: 'Mejorar marca', icon: <span>📈</span> },
  { key: 'Competir', label: 'Competir', icon: <span>🏁</span> },
]

const SPORTS: SegOption<Discipline>[] = [
  { key: 'Running', label: 'Running', icon: <RunIcon />, disabled: true },
  { key: 'Triatlón', label: 'Triatlón', icon: <TriIcon /> },
  { key: 'Ciclismo', label: 'Ciclismo', icon: <BikeIcon />, disabled: true },
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

const CUTOFFS: SegOption<CutoffPressure>[] = [
  { key: 'Generoso', label: 'Generoso' },
  { key: 'Moderado', label: 'Moderado' },
  { key: 'Estricto', label: 'Estricto' },
]

const SEASONS: SegOption<MatchPreferences['season']>[] = [
  { key: 'Próximo mes', label: 'Próximo mes' },
  { key: 'Este semestre', label: 'Este semestre' },
  { key: 'Sin apuro', label: 'Sin apuro' },
]

const SPORT_META: Record<Discipline, { noun: string; verb: string; genderSuffix: 'a' | 'o' }> = {
  Running: { noun: 'carrera', verb: 'correr', genderSuffix: 'a' },
  Triatlón: { noun: 'triatlón', verb: 'competir', genderSuffix: 'o' },
  Ciclismo: { noun: 'fondo', verb: 'pedalear', genderSuffix: 'o' },
}

const TOTAL_STEPS = 7

function questionFor(step: number, sport: Discipline, hasTerrainChoice: boolean): { q: string; sub?: string } {
  const meta = SPORT_META[sport]
  switch (step) {
    case 0:
      return { q: '¿Qué deporte te mueve?', sub: 'Ajustamos cada pregunta siguiente a tu disciplina.' }
    case 1:
      return {
        q: `Para tu próxim${meta.genderSuffix} ${meta.noun}, ¿qué buscas?`,
        sub: 'Esto reordena qué tan importante es cada factor en tu match.',
      }
    case 2:
      return sport === 'Triatlón' ? { q: '¿Qué formato de triatlón buscas?' } : { q: `¿Qué distancia quieres ${meta.verb}?` }
    case 3:
      return hasTerrainChoice
        ? { q: `¿Dónde te gusta ${meta.verb} y qué tan exigente lo quieres?` }
        : { q: '¿Qué tan exigente quieres tu triatlón?' }
    case 4:
      return { q: '¿Cuánto desnivel aguantas y qué presupuesto manejas?' }
    case 5:
      return { q: '¿Qué tan ajustado quieres el tiempo de corte, y para cuándo?' }
    case 6:
      return {
        q: '¿Cuál es tu clima ideal para rendir al máximo?',
        sub: 'Usamos la sensación térmica real de cada carrera, no solo la temperatura.',
      }
    default:
      return { q: '' }
  }
}

function useAnimatedNumber(target: number, duration = 650) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)

  useEffect(() => {
    const from = fromRef.current
    if (from === target) return
    const start = performance.now()
    let raf: number

    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = Math.round(from + (target - from) * eased)
      setValue(current)
      fromRef.current = current
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])

  return value
}

export function MatchConsole({ events }: { events: EventRow[] }) {
  const router = useRouter()
  const { savePref } = useMatchPreferences()
  const [copied, setCopied] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [quizStep, setQuizStep] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [justRevealed, setJustRevealed] = useState(false)
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const revealRef = useRef<HTMLDivElement>(null)
  const [pref, setPref] = useState<MatchPreferences>({
    goal: 'Mejorar marca',
    sport: 'Triatlón',
    distance: defaultDistanceFor('Triatlón'),
    terrain: defaultTerrainFor('Triatlón'),
    exigencia: 'Intermedio',
    climateIdeal: 16,
    elevationBucket: 'Ondulado',
    costBucket: 'Medio',
    cutoffPressure: 'Moderado',
    season: 'Este semestre',
  })

  useEffect(() => () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
  }, [])

  function selectAndAdvance(update: (p: MatchPreferences) => MatchPreferences) {
    setPref(update)
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    advanceTimer.current = setTimeout(() => setQuizStep((s) => Math.min(s + 1, TOTAL_STEPS - 1)), 320)
  }

  function handleFinish() {
    setQuizDone(true)
    setJustRevealed(true)
    savePref(pref)
    setTimeout(() => setJustRevealed(false), 1200)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
    }
  }

  const ranked = useMemo(() => computeMatch(events, pref), [events, pref])
  const top = ranked[0]
  const animatedScore = useAnimatedNumber(top?.matchScore ?? 0)
  const sportCount = events.filter((e) => e.discipline === pref.sport).length

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
  const hasTerrainChoice = terrainOptions.length > 1
  const weights = WEIGHT_PROFILES[pref.goal]

  const breakdown = [
    {
      label: 'Distancia',
      weight: weights.distance,
      earned: top.distFrac,
      icon: <RulerIcon />,
      short: eventDistances,
      detail:
        top.distFrac === 1 ? `Coincide: ofrece ${eventDistances}` : `Ofrece ${eventDistances}, buscabas ${pref.distance}`,
    },
    {
      label: 'Terreno',
      weight: weights.terrain,
      earned: top.terrainOk ? 1 : 0,
      icon: TERRAIN_META[top.event.terrain].icon,
      short: top.event.terrain,
      detail: noTerrainForSport
        ? `Todavía no tenemos carreras de ${pref.terrain} en ${pref.sport.toLowerCase()}`
        : top.terrainOk
          ? `Coincide: ${top.event.terrain}`
          : `Es ${top.event.terrain}, buscabas ${pref.terrain}`,
    },
    {
      label: 'Costo',
      weight: weights.cost,
      earned: top.costFrac,
      icon: <CoinIcon />,
      short: `${costBucket(pref.sport, eventCost)} · ${costLabel(top.event)}`,
      detail:
        top.costFrac === 1
          ? `Coincide: ${costBucket(pref.sport, eventCost)} (${costLabel(top.event)} estimado)`
          : `Es ${costBucket(pref.sport, eventCost)} (${costLabel(top.event)} estimado), buscabas ${pref.costBucket}`,
    },
    {
      label: 'Exigencia',
      weight: weights.level,
      earned: top.levelFrac,
      icon: <BarsIcon active={3} />,
      short: top.event.exigencia,
      detail:
        top.levelFrac === 1
          ? `Coincide: nivel ${top.event.exigencia}`
          : `Es ${top.event.exigencia}, buscabas ${pref.exigencia}`,
    },
    {
      label: 'Desnivel',
      weight: weights.elevation,
      earned: top.elevationFrac,
      icon: <MountainIcon />,
      short: `${elevationBucket(pref.sport, eventElevation)} · +${eventElevation}m`,
      detail:
        top.elevationFrac === 1
          ? `Coincide: ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m)`
          : `Es ${elevationBucket(pref.sport, eventElevation)} (+${eventElevation}m), buscabas ${pref.elevationBucket}`,
    },
    {
      label: 'Clima',
      weight: weights.climate,
      earned: top.climateFrac,
      icon: <ThermoIcon />,
      short: `${top.feelsLike}°C sensación`,
      detail: `Sensación térmica ${top.feelsLike}°C (${top.event.temp_avg_c}°C, ${top.event.humidity_pct}% humedad), ideal ${pref.climateIdeal}°C`,
    },
    {
      label: 'Tiempo de corte',
      weight: weights.cutoff,
      earned: top.cutoffFrac,
      icon: <ClockIcon />,
      short: top.event.cutoff_pressure,
      detail:
        top.cutoffFrac === 1
          ? `Coincide: cierre de meta ${top.event.cutoff_pressure.toLowerCase()}`
          : `Cierre de meta ${top.event.cutoff_pressure.toLowerCase()}, buscabas ${pref.cutoffPressure.toLowerCase()}`,
    },
    {
      label: 'Temporada',
      weight: weights.season,
      earned: top.seasonFrac,
      icon: <CalendarIcon />,
      short: new Date(top.event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' }),
      detail:
        top.seasonFrac === 1
          ? `Coincide con lo que buscabas: ${pref.season.toLowerCase()}`
          : `Es en ${new Date(top.event.event_date).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}, buscabas algo "${pref.season.toLowerCase()}"`,
    },
  ]

  const tier = (frac: number) => (frac >= 0.75 ? 'good' : frac >= 0.4 ? 'warn' : 'bad')
  const scoreTier = tier(top.matchScore / 100)
  const scoreTierLabel = { good: '🔥 Match fuerte', warn: 'Match parcial', bad: 'Match débil' }[scoreTier]

  const highlights = [...breakdown].sort((a, b) => b.earned - a.earned).slice(0, 4)

  const strongCount = breakdown.filter((b) => b.earned >= 0.75).length
  const weakest = [...breakdown].sort((a, b) => a.earned - b.earned)[0]
  const summary =
    strongCount === breakdown.length
      ? `Los ${breakdown.length} criterios calzan casi perfecto con tu perfil.`
      : `${strongCount} de ${breakdown.length} criterios calzan perfecto. En ${weakest.label.toLowerCase()}: ${weakest.detail}.`

  const { q: question, sub: questionSub } = questionFor(quizStep, pref.sport, hasTerrainChoice)

  const summaryChips = [
    pref.sport,
    pref.goal,
    pref.distance,
    ...(hasTerrainChoice ? [pref.terrain] : []),
    pref.exigencia,
    pref.elevationBucket,
    pref.costBucket,
    pref.cutoffPressure,
    pref.season,
    `${pref.climateIdeal}°C ideal`,
  ]

  async function handleShare() {
    const shareText = `${top!.matchScore}% de compatibilidad con ${top!.event.name} — encontrado en NextRace`
    const shareUrl = typeof window !== 'undefined' ? window.location.origin + `/eventos/${top!.event.slug}` : undefined
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Mi match en NextRace', text: shareText, url: shareUrl })
      } catch {
        // el usuario canceló el share sheet, no hacer nada
      }
      return
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareText}${shareUrl ? ' — ' + shareUrl : ''}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="console-shell">
      <div>
        <div className="console-head">
          <div>
            <h3>Encuentra tu match</h3>
            <p className="sub">Responde {TOTAL_STEPS} preguntas y descubre tu carrera ideal.</p>
          </div>
          <div className="console-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            {sportCount} carreras de {pref.sport.toLowerCase()} evaluadas
          </div>
        </div>

        {quizDone ? (
          <div className="quiz-summary">
            <span className="clabel">Tu perfil</span>
            <div className="quiz-summary-chips">
              {summaryChips.map((c, i) => (
                <span className="reveal-chip" key={i}>
                  {c}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="quiz-edit"
              onClick={() => {
                setQuizDone(false)
                setQuizStep(0)
              }}
            >
              ✎ Editar mis respuestas
            </button>
          </div>
        ) : (
          <div className="quiz-card">
            <div className="quiz-progress">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div key={i} className={`quiz-seg ${i < quizStep ? 'done' : i === quizStep ? 'current' : ''}`} />
              ))}
            </div>
            <div className="quiz-step-count">
              Pregunta {quizStep + 1} de {TOTAL_STEPS}
            </div>

            <div className="quiz-body" key={quizStep}>
              <h4 className="quiz-question">{question}</h4>
              {questionSub && <p className="quiz-sub">{questionSub}</p>}

              {quizStep === 0 && (
                <TileSelect
                  options={SPORTS}
                  value={pref.sport}
                  onChange={(sport) =>
                    selectAndAdvance((p) => ({ ...p, sport, distance: defaultDistanceFor(sport), terrain: defaultTerrainFor(sport) }))
                  }
                />
              )}

              {quizStep === 1 && (
                <TileSelect options={GOALS} value={pref.goal} onChange={(goal) => selectAndAdvance((p) => ({ ...p, goal }))} />
              )}

              {quizStep === 2 && (
                <TileSelect
                  options={DISTANCE_OPTIONS[pref.sport]}
                  value={pref.distance}
                  onChange={(distance) => selectAndAdvance((p) => ({ ...p, distance }))}
                />
              )}

              {quizStep === 3 && (
                <div className={hasTerrainChoice ? 'rail-pair' : 'rail-block'}>
                  {hasTerrainChoice && (
                    <div>
                      <span className="clabel">Terreno</span>
                      <TileSelect options={terrainOptions} value={pref.terrain} onChange={(terrain) => setPref((p) => ({ ...p, terrain }))} />
                    </div>
                  )}
                  <div>
                    <span className="clabel">Exigencia</span>
                    <TileSelect options={LEVELS} value={pref.exigencia} onChange={(exigencia) => setPref((p) => ({ ...p, exigencia }))} />
                  </div>
                </div>
              )}

              {quizStep === 4 && (
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
              )}

              {quizStep === 5 && (
                <div className="rail-pair">
                  <div>
                    <span className="clabel">Tiempo de corte</span>
                    <TileSelect
                      options={CUTOFFS}
                      value={pref.cutoffPressure}
                      onChange={(cutoffPressure) => setPref((p) => ({ ...p, cutoffPressure }))}
                    />
                  </div>
                  <div>
                    <span className="clabel">¿Cuándo?</span>
                    <TileSelect options={SEASONS} value={pref.season} onChange={(season) => setPref((p) => ({ ...p, season }))} />
                  </div>
                </div>
              )}

              {quizStep === 6 && (
                <div className="rail-block" style={{ marginBottom: 0 }}>
                  <ClimateSlider value={pref.climateIdeal} onChange={(climateIdeal) => setPref((p) => ({ ...p, climateIdeal }))} />
                </div>
              )}
            </div>

            {(quizStep > 0 || quizStep >= 3) && (
              <div className="quiz-nav">
                {quizStep > 0 ? (
                  <button type="button" className="quiz-back" onClick={() => setQuizStep((s) => Math.max(0, s - 1))}>
                    <BackIcon /> Atrás
                  </button>
                ) : (
                  <span />
                )}
                {quizStep >= 3 && quizStep <= 5 && (
                  <button type="button" className="quiz-continue" onClick={() => setQuizStep((s) => Math.min(s + 1, TOTAL_STEPS - 1))}>
                    Continuar
                  </button>
                )}
                {quizStep === 6 && (
                  <button type="button" className="quiz-continue" onClick={handleFinish}>
                    Ver mi match →
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div ref={revealRef}>
        <div className={`reveal-card tone-${scoreTier} ${justRevealed ? 'just-revealed' : ''}`}>
          {top.event.image_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img className="reveal-bg" src={top.event.image_url} alt="" />
          )}
          <div className="reveal-top">
            <div className="reveal-brand">
              <svg viewBox="0 0 28 28">
                <rect width="28" height="28" rx="8" fill="#2f9bff" />
                <path d="M10 8l5 6-5 6" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              NextRace Match
            </div>
            <button type="button" className="reveal-share" onClick={handleShare} aria-label="Compartir">
              <ShareIcon />
            </button>
          </div>

          <div className="reveal-mid">
            <div className={`reveal-tag tone-${scoreTier}`}>{scoreTierLabel}</div>
            <div className="reveal-score">
              {animatedScore}
              <sup>%</sup>
            </div>
            <div className="reveal-score-label">Compatibilidad</div>
          </div>

          <div className="reveal-bottom">
            <div className="reveal-name">{top.event.name}</div>
            <div className="reveal-loc">
              📍 {top.event.city}, {top.event.region} ·{' '}
              {new Date(top.event.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            <div className="reveal-chips">
              {highlights.map((h) => (
                <div className="reveal-chip" key={h.label}>
                  {h.icon}
                  {h.short}
                </div>
              ))}
            </div>
            <div className="reveal-cta">
              <button type="button" className="reveal-btn primary" onClick={handleShare}>
                <ShareIcon />
                {copied ? '¡Copiado!' : 'Compartir'}
              </button>
              <button type="button" className="reveal-btn ghost" onClick={() => router.push(`/eventos/${top.event.slug}`)}>
                Ver carrera
              </button>
            </div>
          </div>
        </div>

        <button type="button" className="reveal-more" onClick={() => setShowDetail((v) => !v)}>
          {showDetail ? 'Ocultar' : 'Ver'} informe completo de compatibilidad {showDetail ? '↑' : '↓'}
        </button>

        {showDetail && (
          <div className="detail-list">
            <p className="detail-summary">{summary}</p>
            {breakdown.map((b) => {
              const t = tier(b.earned)
              return (
                <div className={`detail-row tone-${t}`} key={b.label}>
                  <div className="detail-row-icon">{b.icon}</div>
                  <div className="detail-row-body">
                    <div className="detail-row-top">
                      <span className="k">{b.label}</span>
                      <span className="v">{Math.round(b.earned * 100)}%</span>
                    </div>
                    <div className="detail-row-track">
                      <div className="detail-row-fill" style={{ width: `${Math.max(6, Math.round(b.earned * 100))}%` }} />
                    </div>
                    <div className="detail-row-detail">{b.detail}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
