'use client'

import { useCallback, useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import type { RoutePoint } from '@/lib/paseos/types'

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const TILE_ATTR = '&copy; OpenStreetMap contributors'

interface PaseoMapProps {
  route: RoutePoint[]
  live?: boolean
}

export function PaseoMap({ route, live }: PaseoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const lineRef = useRef<import('leaflet').Polyline | null>(null)
  const startMarkerRef = useRef<import('leaflet').Marker | null>(null)
  const endMarkerRef = useRef<import('leaflet').Marker | null>(null)

  const renderRoute = useCallback(
    (L: typeof import('leaflet'), map: import('leaflet').Map) => {
      const latlngs = route.map((p) => [p.lat, p.lng] as [number, number])

      if (lineRef.current) {
        lineRef.current.setLatLngs(latlngs)
      } else if (latlngs.length > 0) {
        lineRef.current = L.polyline(latlngs, { color: '#2f9bff', weight: 4, opacity: 0.9 }).addTo(map)
      }

      if (route.length > 0) {
        const startIcon = L.divIcon({ className: 'paseo-pin paseo-pin-start', html: '<span></span>', iconSize: [16, 16], iconAnchor: [8, 8] })
        if (!startMarkerRef.current) {
          startMarkerRef.current = L.marker(latlngs[0], { icon: startIcon }).addTo(map).bindPopup('Inicio')
        } else {
          startMarkerRef.current.setLatLng(latlngs[0])
        }
      }

      if (route.length > 1) {
        const last = latlngs[latlngs.length - 1]
        const endIcon = L.divIcon({
          className: `paseo-pin ${live ? 'paseo-pin-live' : 'paseo-pin-end'}`,
          html: '<span></span>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        })
        if (!endMarkerRef.current) {
          endMarkerRef.current = L.marker(last, { icon: endIcon }).addTo(map).bindPopup(live ? 'Ahora' : 'Término')
        } else {
          endMarkerRef.current.setLatLng(last)
        }
      }

      if (latlngs.length > 1) {
        map.fitBounds(L.latLngBounds(latlngs), { padding: [28, 28], maxZoom: 17 })
      } else if (latlngs.length === 1) {
        map.setView(latlngs[0], 16)
      }
    },
    [route, live]
  )

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: false }).setView(
        route[0] ? [route[0].lat, route[0].lng] : [-33.4489, -70.6693],
        16
      )
      L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 19 }).addTo(map)
      mapRef.current = map
      renderRoute(L, map)
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    import('leaflet').then((L) => renderRoute(L, mapRef.current!))
  }, [renderRoute])

  return <div className="paseo-map" ref={containerRef} />
}
