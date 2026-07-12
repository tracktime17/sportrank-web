'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useCompare } from '@/lib/store/useCompare'
import { CompareTable } from '@/components/compare/CompareTable'
import type { EventRow } from '@/lib/supabase/types'

export default function ComparePage() {
  const { ids, hydrated, remove } = useCompare()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    if (ids.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    setLoading(true)
    supabase
      .from('events')
      .select('*')
      .in('id', ids)
      .returns<EventRow[]>()
      .then(({ data }) => {
        // Mantiene el mismo orden en que se agregaron al comparador
        const byId = new Map((data ?? []).map((e) => [e.id, e]))
        setEvents(ids.map((id) => byId.get(id)).filter(Boolean) as EventRow[])
        setLoading(false)
      })
  }, [ids, hydrated])

  return (
    <div className="wrap section view-enter" style={{ paddingTop: 44 }}>
      <div className="section-head">
        <div>
          <h2>Comparador</h2>
          <p>Hasta 3 competencias, lado a lado</p>
        </div>
      </div>
      {!loading && <CompareTable events={events} onRemove={remove} />}
    </div>
  )
}
