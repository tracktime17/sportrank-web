'use client'

import type { SegOption } from '@/components/ui/Seg'

interface TileSelectProps<T extends string> {
  options: SegOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * Selector de tarjetas: cada opción es su propio bloque que se ilumina al
 * elegirse, en vez de una píldora deslizante compartida. Se usa en la
 * consola de match, donde cada control necesita sentirse como una elección
 * táctil y no como un campo de formulario.
 */
export function TileSelect<T extends string>({ options, value, onChange, className }: TileSelectProps<T>) {
  return (
    <div className={`tiles ${className ?? ''}`}>
      {options.map((opt) => (
        <button
          key={opt.key}
          type="button"
          className={`tile ${opt.key === value ? 'active' : ''}`}
          onClick={() => onChange(opt.key)}
        >
          {opt.icon}
          <span className="t-label">{opt.label}</span>
          {opt.hint && <span className="t-hint">{opt.hint}</span>}
        </button>
      ))}
    </div>
  )
}
