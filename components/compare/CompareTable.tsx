'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { DISCIPLINE_ICON, CloseIcon, CompareIcon } from '@/components/ui/Icons'
import { costRange, costLabel, fmtCLP } from '@/lib/events'
import type { EventRow } from '@/lib/supabase/types'

type RowType = 'time' | 'pct-high' | 'unit' | 'dots' | 'number' | 'price' | 'travel' | 'costTotal' | 'text'

interface CompareRow {
  key: string
  label: string
  type: RowType
  unit?: string
  low?: boolean
}

const ROWS: CompareRow[] = [
  { key: 'projected_time', label: 'Tiempo esperado', type: 'time' },
  { key: 'compatibility', label: 'Compatibilidad', type: 'pct-high' },
  { key: 'pr_probability', label: 'Probabilidad de PR', type: 'pct-high' },
  { key: 'temp_avg_c', label: 'Temperatura', type: 'unit', unit: '°C', low: true },
  { key: 'humidity_pct', label: 'Humedad', type: 'unit', unit: '%', low: true },
  { key: 'elevation_gain_m', label: 'Desnivel', type: 'unit', unit: 'm', low: true },
  { key: 'landscape_rating', label: 'Paisaje', type: 'dots' },
  { key: 'entrants', label: 'Inscritos', type: 'number' },
  { key: 'exigencia', label: 'Exigencia', type: 'text' },
  { key: 'price_clp', label: 'Inscripción', type: 'price', low: true },
  { key: 'travel_mode', label: 'Traslado (desde Stgo)', type: 'travel' },
  { key: 'costTotal', label: 'Costo total estimado', type: 'costTotal', low: true },
]

function timeToSeconds(t: string | null) {
  if (!t) return Infinity
  const [h, m, s] = t.split(':').map(Number)
  return h * 3600 + m * 60 + s
}

function bestIndexForRow(row: CompareRow, events: EventRow[]) {
  const values = events.map((e) => {
    if (row.type === 'time') return timeToSeconds(e.projected_time)
    if (row.type === 'dots') return e.landscape_rating ?? 0
    if (row.type === 'costTotal') {
      const c = costRange(e)
      return (c.min + c.max) / 2
    }
    return (e as unknown as Record<string, number>)[row.key] ?? 0
  })
  if (row.low) return values.indexOf(Math.min(...values))
  if (row.type === 'text' || row.type === 'travel') return -1
  return values.indexOf(Math.max(...values))
}

function Dots({ n, max = 5 }: { n: number; max?: number }) {
  return (
    <span className="dots">
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} className={i < n ? 'on' : ''} />
      ))}
    </span>
  )
}

export function CompareTable({ events, onRemove }: { events: EventRow[]; onRemove: (id: string) => void }) {
  if (events.length === 0) {
    return (
      <div className="compare-empty">
        <h2>Aún no agregaste competencias</h2>
        <p>Toca el ícono de comparar en cualquier tarjeta — hasta 3 a la vez.</p>
        <div style={{ marginTop: 24 }}>
          <Link href="/explorar" className="btn btn-primary">
            Explorar competencias
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
        <div style={{ width: 130, flexShrink: 0 }} />
        {events.map((e) => {
          const Icon = DISCIPLINE_ICON[e.discipline]
          return (
            <div className="compare-col-head" key={e.id}>
              <button type="button" className="compare-remove" onClick={() => onRemove(e.id)} aria-label="Quitar">
                <CloseIcon />
              </button>
              <div className="icon-badge-sm">
                <Icon />
              </div>
              <div className="cname">{e.name}</div>
              <div className="cloc">
                {e.city} · {new Date(e.event_date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          )
        })}
        {events.length < 3 && (
          <div className="compare-add-slot">
            <CompareIcon />
            <span>+ Agregar otra</span>
            <Link href="/explorar" className="btn btn-ghost btn-sm">
              Explorar
            </Link>
          </div>
        )}
      </div>

      <div className="compare-scroll">
        <table className="compare-table">
          <tbody>
            {ROWS.map((row) => {
              const bestIdx = bestIndexForRow(row, events)
              return (
                <tr key={row.key}>
                  <td className="compare-rowlabel" style={{ width: 130 }}>
                    {row.label}
                  </td>
                  {events.map((e, i) => {
                    let display: ReactNode
                    const raw = (e as unknown as Record<string, unknown>)[row.key]
                    if (row.type === 'pct-high') display = `${raw}%`
                    else if (row.type === 'unit') display = `${raw}${row.unit}`
                    else if (row.type === 'dots') display = <Dots n={e.landscape_rating ?? 0} />
                    else if (row.type === 'number') display = (raw as number)?.toLocaleString('es-CL')
                    else if (row.type === 'price') display = fmtCLP(raw as number)
                    else if (row.type === 'travel') display = e.travel_mode
                    else if (row.type === 'costTotal') display = costLabel(e)
                    else display = String(raw ?? '—')

                    const isBest = i === bestIdx
                    return (
                      <td key={e.id} style={{ width: 210 }}>
                        <span className={`compare-value ${isBest ? 'compare-best' : ''}`}>{display}</span>
                        {isBest && <span className="compare-best-tag">✓ mejor</span>}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
