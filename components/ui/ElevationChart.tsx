export function ElevationChart({ elevation }: { elevation: number }) {
  const n = elevation > 1000 ? 7 : elevation > 400 ? 7 : 3
  const heights =
    elevation > 1000
      ? [70, 40, 80, 20, 60, 10, 50]
      : elevation > 400
        ? [85, 70, 88, 60, 90, 75, 95]
        : [95, 92, 96]

  const w = 320 / n
  let path = 'M0,95 '
  for (let i = 0; i <= n; i++) {
    const h = heights[i] ?? heights[heights.length - 1]
    path += `L${i * w},${95 - h * 0.82} `
  }
  path += 'L320,95 Z'

  return (
    <svg className="elev-svg" viewBox="0 0 320 100" preserveAspectRatio="none">
      <path d={path} fill="var(--accent-tint)" stroke="var(--accent)" strokeWidth={1.5} />
    </svg>
  )
}
