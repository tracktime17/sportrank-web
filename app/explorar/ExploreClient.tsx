'use client'

import { useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Seg, type SegOption } from '@/components/ui/Seg'
import { EventCard } from '@/components/ui/EventCard'
import { RunIcon, TriIcon, BikeIcon } from '@/components/ui/Icons'
import type { Discipline, EventRow } from '@/lib/supabase/types'

type FilterValue = 'Todos' | Discipline

const OPTIONS: SegOption<FilterValue>[] = [
  { key: 'Todos', label: 'Todos' },
  { key: 'Running', label: 'Running', icon: <RunIcon /> },
  { key: 'Triatlón', label: 'Triatlón', icon: <TriIcon /> },
  { key: 'Ciclismo', label: 'Ciclismo', icon: <BikeIcon /> },
]

export function ExploreClient({ events }: { events: EventRow[] }) {
  const searchParams = useSearchParams()
  const initial = (searchParams.get('deporte') as FilterValue) ?? 'Todos'
  const [filter, setFilter] = useState<FilterValue>(OPTIONS.some((o) => o.key === initial) ? initial : 'Todos')

  const filtered = useMemo(
    () => (filter === 'Todos' ? events : events.filter((e) => e.discipline === filter)),
    [events, filter]
  )

  return (
    <>
      <div className="page-head" style={{ paddingBottom: 0 }}>
        <div className="eyebrow">{filtered.length} competencias encontradas</div>
        <h1 style={{ fontSize: '1.9rem', marginTop: 8 }}>Explorar competencias</h1>
      </div>

      <div className="disc-tabs-wrap">
        <Seg options={OPTIONS} value={filter} onChange={setFilter} />
      </div>

      <section className="section section-top">
        <div className="grid">
          {filtered.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
        </div>
      </section>
    </>
  )
}
