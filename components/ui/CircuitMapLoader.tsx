'use client'

import dynamic from 'next/dynamic'

const CircuitMap = dynamic(() => import('./CircuitMap').then((m) => m.CircuitMap), {
  ssr: false,
  loading: () => <div className="circuit-map-skeleton" />,
})

export { CircuitMap as CircuitMapLoader }
