import { Suspense } from 'react'
import { getEvents } from '@/lib/events-server'
import { isLaunched } from '@/lib/events'
import { ExploreClient } from './ExploreClient'

export const revalidate = 60

export default async function ExplorePage() {
  const events = (await getEvents()).filter((e) => isLaunched(e.discipline))

  return (
    <div className="wrap view-enter">
      {/* useSearchParams necesita un límite Suspense en Next.js */}
      <Suspense fallback={null}>
        <ExploreClient events={events} />
      </Suspense>
    </div>
  )
}
