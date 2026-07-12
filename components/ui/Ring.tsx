'use client'

interface RingProps {
  score: number
  size: number
  stroke: number
  fontSize?: number
  className?: string
}

/**
 * El anillo de progreso es el único motivo circular del sistema —
 * se usa en las tarjetas (chico), en la consola de match (mediano)
 * y en el Performance Score del detalle (grande). Misma matemática
 * en los tres casos, solo cambia tamaño.
 */
export function Ring({ score, size, stroke, fontSize, className }: RingProps) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - score / 100)
  const fs = fontSize ?? size * 0.27

  return (
    <div className={`ring ${className ?? ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="ring-num tab-num" style={{ fontSize: fs }}>
        {score}
      </span>
    </div>
  )
}
