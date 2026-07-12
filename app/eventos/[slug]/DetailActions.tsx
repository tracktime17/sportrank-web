'use client'

import { useRouter } from 'next/navigation'
import { HeartIcon, CompareIcon, BackIcon } from '@/components/ui/Icons'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'

export function DetailActions({ eventId }: { eventId: string }) {
  const router = useRouter()
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { isCompared, toggle: toggleCompare } = useCompare()
  const fav = isFavorite(eventId)
  const compared = isCompared(eventId)

  return (
    <>
      <button type="button" className="detail-hero-back" onClick={() => router.push('/explorar')} aria-label="Volver">
        <BackIcon />
      </button>
      <div className="detail-hero-actions">
        <button
          type="button"
          className={`icon-btn ${compared ? 'is-compared' : ''}`}
          onClick={() => toggleCompare(eventId)}
          aria-label="Agregar a comparar"
        >
          <CompareIcon />
        </button>
        <button
          type="button"
          className={`icon-btn ${fav ? 'active' : ''}`}
          onClick={() => toggleFavorite(eventId)}
          aria-label="Guardar en favoritos"
        >
          <HeartIcon />
        </button>
      </div>
    </>
  )
}
