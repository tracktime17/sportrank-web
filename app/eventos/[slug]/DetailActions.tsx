'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { HeartIcon, CompareIcon, BackIcon, ShareIcon } from '@/components/ui/Icons'
import { useFavorites } from '@/lib/store/useFavorites'
import { useCompare } from '@/lib/store/useCompare'

export function DetailBack() {
  const router = useRouter()
  return (
    <button type="button" className="detail-hero-back" onClick={() => router.push('/explorar')} aria-label="Volver">
      <BackIcon />
    </button>
  )
}

export function DetailCtaRow({ eventId, eventName }: { eventId: string; eventName: string }) {
  const { isFavorite, toggle: toggleFavorite } = useFavorites()
  const { isCompared, toggle: toggleCompare } = useCompare()
  const [copied, setCopied] = useState(false)
  const fav = isFavorite(eventId)
  const compared = isCompared(eventId)

  async function handleShare() {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : undefined
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: eventName, text: `Mira ${eventName} en NextRace`, url: shareUrl })
      } catch {
        // el usuario canceló el share sheet, no hacer nada
      }
      return
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="detail-cta-row">
      <button
        type="button"
        className={`detail-cta primary ${fav ? 'is-active' : ''}`}
        onClick={() => toggleFavorite(eventId)}
      >
        <HeartIcon />
        {fav ? 'Te interesa esta carrera' : 'Me interesa esta carrera'}
      </button>
      <button
        type="button"
        className={`detail-cta ghost ${compared ? 'is-active' : ''}`}
        onClick={() => toggleCompare(eventId)}
      >
        <CompareIcon />
        {compared ? 'En tu comparador' : 'Comparar'}
      </button>
      <button type="button" className="detail-cta ghost" onClick={handleShare}>
        <ShareIcon />
        {copied ? '¡Copiado!' : 'Compartir'}
      </button>
    </div>
  )
}
