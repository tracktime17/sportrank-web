import { EventCard } from '@/components/ui/EventCard'
import type { EventRow } from '@/lib/supabase/types'

export function Rail({ events }: { events: EventRow[] }) {
  if (events.length === 0) {
    return <p style={{ color: 'var(--text-2)', fontSize: 13.5 }}>Todavía no hay competencias publicadas aquí.</p>
  }
  return (
    <div className="rail">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  )
}
