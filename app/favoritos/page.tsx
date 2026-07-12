'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFavorites } from '@/lib/store/useFavorites'
import { EventCard } from '@/components/ui/EventCard'
import type { EventRow } from '@/lib/supabase/types'

export default function FavoritesPage() {
  const { ids, hydrated } = useFavorites()
  const [events, setEvents] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hydrated) return
    const idList = [...ids]
    if (idList.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }
    const supabase = createClient()
    setLoading(true)
    supabase
      .from('events')
      .select('*')
      .in('id', idList)
      .returns<EventRow[]>()
      .then(({ data }) => {
        setEvents(data ?? [])
        setLoading(false)
      })
  }, [ids, hydrated])

  const bestPR = [...events].sort((a, b) => (b.pr_probability ?? 0) - (a.pr_probability ?? 0))[0]

  return (
    <div className="wrap section view-enter" style={{ paddingTop: 44 }}>
      <div className="section-head">
        <div>
          <h2>Mis favoritos</h2>
          <p>{events.length > 0 ? `${events.length} guardadas` : ''}</p>
        </div>
      </div>

      {loading ? null : events.length === 0 ? (
        <div className="empty-state">
          <h2>Aún no guardas ninguna carrera</h2>
          <p>Explora y toca el ícono de favorito en la que te haga vibrar.</p>
          <div style={{ marginTop: 22 }}>
            <Link href="/explorar" className="btn btn-primary">
              Explorar competencias
            </Link>
          </div>
        </div>
      ) : (
        <>
          {bestPR && (
            <div className="fav-highlight">
              <div>
                <div className="eyebrow" style={{ marginBottom: 10 }}>
                  Mi mejor oportunidad de PR
                </div>
                <h3>{bestPR.name}</h3>
                <p>Probabilidad de PR de {bestPR.pr_probability}% — la más alta entre tus favoritas.</p>
              </div>
              <Link href={`/eventos/${bestPR.slug}`} className="btn btn-primary btn-sm">
                Ver preparación recomendada
              </Link>
            </div>
          )}
          <div className="grid">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
