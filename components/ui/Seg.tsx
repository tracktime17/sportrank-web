'use client'

import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export interface SegOption<T extends string> {
  key: T
  label: string
  hint?: string
  icon?: ReactNode
  bars?: number
  disabled?: boolean
}

interface SegProps<T extends string> {
  options: SegOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Control deslizante: una píldora de fondo se anima hacia el botón activo.
 * Se usa para deporte, distancia, terreno, nivel de exigencia, y las
 * pestañas de disciplina en Explorar — mismo componente en todos lados,
 * consistencia real en vez de reinventar el control cada vez.
 */
export function Seg<T extends string>({ options, value, onChange, className }: SegProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [fillStyle, setFillStyle] = useState<{ width: number; left: number }>({ width: 0, left: 0 })

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const activeBtn = container.querySelector<HTMLButtonElement>('button.active')
    if (!activeBtn) return
    setFillStyle({ width: activeBtn.offsetWidth, left: activeBtn.offsetLeft })
  }, [value, options])

  return (
    <div className={`seg ${className ?? ''}`} ref={containerRef}>
      <div
        className="seg-fill"
        style={{ width: fillStyle.width, transform: `translateX(${fillStyle.left}px)` }}
      />
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`${opt.key === value ? 'active' : ''} ${opt.disabled ? 'disabled' : ''}`}
          onClick={() => !opt.disabled && onChange(opt.key)}
          disabled={opt.disabled}
        >
          {opt.icon}
          <span>{opt.label}</span>
          {opt.disabled ? <span className="hint">Próximamente</span> : opt.hint && <span className="hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  )
}
