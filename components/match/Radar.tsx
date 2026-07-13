export interface RadarAxis {
  label: string
  value: number // 0..1
}

const SIZE = { w: 280, h: 240 }
const CX = 140
const CY = 113
const R = 58

function angleFor(i: number, n: number) {
  return -Math.PI / 2 + (i * 2 * Math.PI) / n
}

function pointAt(i: number, n: number, v: number): [number, number] {
  const a = angleFor(i, n)
  return [CX + v * R * Math.cos(a), CY + v * R * Math.sin(a)]
}

function toPath(points: [number, number][]) {
  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z'
}

function axisTier(value: number) {
  if (value >= 0.75) return 'var(--text-2)'
  if (value >= 0.4) return 'var(--warn)'
  return 'var(--bad)'
}

/**
 * Radar de compatibilidad: compara tu perfil ideal (contorno punteado,
 * siempre al 100%) contra el ajuste real de la carrera sugerida en cada
 * eje. Reutiliza las mismas fracciones (0..1) que ya calcula el motor de
 * match — no es un gráfico decorativo, es la misma matemática del
 * breakdown, mostrada espacialmente en vez de en una lista de texto.
 */
export function Radar({ axes, tone }: { axes: RadarAxis[]; tone: 'good' | 'warn' | 'bad' }) {
  const n = axes.length
  const toneColor = `var(--${tone})`

  const outerPoints = axes.map((_, i) => pointAt(i, n, 1))
  const actualPoints = axes.map((ax, i) => pointAt(i, n, Math.max(0.1, ax.value)))
  const gridRings = [0.33, 0.66, 1].map((r) => axes.map((_, i) => pointAt(i, n, r)))

  return (
    <svg width={SIZE.w} height={SIZE.h} viewBox={`0 0 ${SIZE.w} ${SIZE.h}`} className="radar">
      {gridRings.map((ring, i) => (
        <path key={i} d={toPath(ring)} fill="none" stroke="var(--border-soft)" strokeWidth={1} />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pointAt(i, n, 1)
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--border-soft)" strokeWidth={1} />
      })}

      <path d={toPath(outerPoints)} fill="none" stroke="var(--text-3)" strokeWidth={1.4} strokeDasharray="3 3" />
      <path
        d={toPath(actualPoints)}
        fill={toneColor}
        fillOpacity={0.28}
        stroke={toneColor}
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ transition: 'd 0.35s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {actualPoints.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3.5} fill={toneColor} />
      ))}

      {axes.map((ax, i) => {
        const [lx, ly] = pointAt(i, n, 1.5)
        const cos = Math.cos(angleFor(i, n))
        const anchor = Math.abs(cos) < 0.3 ? 'middle' : cos > 0 ? 'start' : 'end'
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize={10.5}
            fontWeight={700}
            fill={axisTier(ax.value)}
          >
            {ax.label.toUpperCase()}
          </text>
        )
      })}
    </svg>
  )
}
