import { Suspense } from 'react'
import { getEvents } from '@/lib/events-server'
import { ExploreClient } from './ExploreClient'

export default async function ExplorePage() {
  const events = await getEvents()

  return (
    <div className="wrap view-enter">
      {/* useSearchParams necesita un límite Suspense en Next.js */}
      <Suspense fallback={null}>
        <ExploreClient events={events} />
      </Suspense>
    </div>
  )
}
