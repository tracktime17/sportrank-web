'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
const SATELLITE_ATTR = 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
const TOPO_URL = 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png'
const TOPO_ATTR = 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)'

interface CircuitMapProps {
  lat: number
  lng: number
  name: string
  city: string
  region: string
}

export function CircuitMap({ lat, lng, name, city, region }: CircuitMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<import('leaflet').Map | null>(null)
  const layersRef = useRef<{ sat: import('leaflet').TileLayer; topo: import('leaflet').TileLayer } | null>(null)
  const [view, setView] = useState<'sat' | 'topo'>('sat')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current) return

      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      }).setView([lat, lng], 4)

      const sat = L.tileLayer(SATELLITE_URL, { attribution: SATELLITE_ATTR, maxZoom: 17 }).addTo(map)
      const topo = L.tileLayer(TOPO_URL, { attribution: TOPO_ATTR, maxZoom: 17 })
      layersRef.current = { sat, topo }

      const pinIcon = L.divIcon({
        className: 'circuit-pin',
        html: '<span></span>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      })

      L.circle([lat, lng], {
        radius: 1600,
        color: '#2f9bff',
        weight: 1.5,
        fillColor: '#2f9bff',
        fillOpacity: 0.08,
      }).addTo(map)

      L.marker([lat, lng], { icon: pinIcon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br/>${city}, ${region}`)

      window.setTimeout(() => {
        if (!cancelled) map.flyTo([lat, lng], 13, { duration: 2.4 })
      }, 400)

      mapRef.current = map
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleView(next: 'sat' | 'topo') {
    if (!mapRef.current || !layersRef.current || next === view) return
    const map = mapRef.current
    const { sat, topo } = layersRef.current
    if (next === 'topo') {
      map.removeLayer(sat)
      topo.addTo(map)
    } else {
      map.removeLayer(topo)
      sat.addTo(map)
    }
    setView(next)
  }

  return (
    <div className="circuit-map-wrap">
      <div className="circuit-map" ref={containerRef} />
      <div className="circuit-map-badge">📍 Ubicación real — {city}, {region}</div>
      <div className="circuit-map-toggle">
        <button type="button" className={view === 'sat' ? 'active' : ''} onClick={() => toggleView('sat')}>
          Satélite
        </button>
        <button type="button" className={view === 'topo' ? 'active' : ''} onClick={() => toggleView('topo')}>
          Terreno
        </button>
      </div>
    </div>
  )
}
