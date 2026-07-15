import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

export function HeartIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" {...props}>
      <path d="M12 21s-7.5-4.6-10-9.3C.4 8 2 4 6 4c2.2 0 3.7 1.2 6 3.4C14.3 5.2 15.8 4 18 4c4 0 5.6 4 4 7.7-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  )
}

export function CompareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" {...props}>
      <path d="M8 3v18M16 3v18M4 8h4M16 8h4M4 16h4M16 16h4" />
    </svg>
  )
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export function BackIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" {...props}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

export function PinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" {...props}>
      <path d="M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  )
}

export function CloseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" {...props}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

export function RunIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="14.2" cy="4.6" r="1.7" />
      <path d="M6 20l3.3-5.3-2-3 3.6-2.9 2 2.5 4.4-1" />
      <path d="M9.3 14.7L6.3 17.5M12.9 13.3l3.7 2 1.4 4.2" />
    </svg>
  )
}

export function BikeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="6" cy="17" r="3.2" />
      <circle cx="18" cy="17" r="3.2" />
      <path d="M6 17l4-8h4l4 8M10 9l2-3h3M9 17h9" />
    </svg>
  )
}

export function TriIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 8c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 13.5c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
      <path d="M3 19c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0 3-1.4 4.5 0 3 1.4 4.5 0" />
    </svg>
  )
}

export function BuildingIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="9" width="6" height="12" />
      <rect x="14" y="4" width="6" height="17" />
      <path d="M6.5 12h1M6.5 15h1M6.5 18h1M16.5 7h1M16.5 10h1M16.5 13h1M16.5 16h1" />
    </svg>
  )
}

export function MountainIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 19l6-10.5L13 14l2-3 6 8z" />
    </svg>
  )
}

export function WaveIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 11c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
      <path d="M3 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />
    </svg>
  )
}

export function RulerIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 15l5-9 11 6-5 9z" />
      <path d="M9.5 12.7l1-1.8M12 14.1l1-1.8M14.5 15.6l1-1.8" />
    </svg>
  )
}

export function CoinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9M9.5 9.3c0-1 1-1.8 2.5-1.8s2.5.8 2.5 1.7c0 2.3-5 1-5 3.3 0 1 1 1.8 2.5 1.8s2.5-.8 2.5-1.8" />
    </svg>
  )
}

export function ThermoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 14.5V5a2 2 0 10-4 0v9.5a4 4 0 104 0z" />
      <circle cx="10" cy="17" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ClockIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.2 3.2" />
    </svg>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  )
}

export function TargetIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

export function ShareIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.5l6.8-3.8M8.6 13.5l6.8 3.8" />
    </svg>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16 8.3a3 3 0 010 5.9M20.5 19c0-2.6-2-4.6-4.5-5" />
    </svg>
  )
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.2 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.2 5.9-.8z" />
    </svg>
  )
}

export function SearchIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v9a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1v-9" />
    </svg>
  )
}

export const DISCIPLINE_ICON = {
  Running: RunIcon,
  Triatlón: TriIcon,
  Ciclismo: BikeIcon,
} as const

export function BarsIcon({ active }: { active: number }) {
  const heights = [6, 10, 14]
  return (
    <svg viewBox="0 0 21 18" width={15} height={15}>
      {heights.map((h, i) => (
        <rect key={i} x={3 + i * 6} y={18 - h} width={3.4} height={h} rx={1} fill="currentColor" opacity={i < active ? 1 : 0.32} />
      ))}
    </svg>
  )
}
