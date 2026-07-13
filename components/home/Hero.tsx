import Link from 'next/link'
import { DISCIPLINE_ICON } from '@/components/ui/Icons'
import type { EventRow } from '@/lib/supabase/types'

function HeroTile({ event, size }: { event: EventRow; size: 'main' | 'sm' }) {
  const DiscIcon = DISCIPLINE_ICON[event.discipline]
  return (
    <Link href={`/eventos/${event.slug}`} className={`hero-tile hero-tile-${size}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={event.image_url ?? `https://picsum.photos/seed/${event.slug}/1200/900`} alt={event.name} />
      <div className="hero-tile-content">
        <div className="hero-tile-badge">
          <DiscIcon />
          {event.discipline}
        </div>
        <h2>{event.name}</h2>
        <div className="hero-tile-meta">
          {event.city}, {event.region}
        </div>
        {event.score != null && <div className="hero-tile-score">Score {event.score}</div>}
      </div>
    </Link>
  )
}

export function Hero({ featured }: { featured: EventRow[] }) {
  if (featured.length === 0) return null
  const [main, ...rest] = featured

  return (
    <div className="hero-grid">
      <HeroTile event={main} size="main" />
      {rest.length > 0 && (
        <div className="hero-tile-stack">
          {rest.map((event) => (
            <HeroTile key={event.id} event={event} size="sm" />
          ))}
        </div>
      )}
    </div>
  )
}
