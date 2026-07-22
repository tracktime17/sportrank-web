'use client'

import dynamic from 'next/dynamic'

const PaseoMap = dynamic(() => import('./PaseoMap').then((m) => m.PaseoMap), {
  ssr: false,
  loading: () => <div className="paseo-map-skeleton" />,
})

export { PaseoMap as PaseoMapLoader }
