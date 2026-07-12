'use client'

interface ClimateSliderProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

export function ClimateSlider({ value, min = 5, max = 28, onChange }: ClimateSliderProps) {
  const pct = ((value - min) / (max - min)) * 100

  return (
    <div className="climate-row">
      <div className="climate-bubble" style={{ left: `${pct}%` }}>
        {value}°C
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        className="climate-input"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="climate-scale">
        <span>{min}°C</span>
        <span>{max}°C</span>
      </div>
    </div>
  )
}
