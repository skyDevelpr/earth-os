'use client'

import dynamic from 'next/dynamic'
import { useEarthOsStore } from '@/stores/earth-os'

// Globe is client-only (WebGL)
const Globe = dynamic(
  () => import('./Globe').then(m => ({ default: m.Globe })),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#05070d',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            border: '2px solid #1f2a3d',
            borderTopColor: '#00d4ff',
            animation: 'spin 1s linear infinite',
          }}
        />
        <div style={{ fontSize: 12, color: '#4a5568', letterSpacing: '0.08em' }}>
          INITIALIZING GLOBE
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    ),
  }
)

export function GlobeContainer() {
  const { earthquakes, eonetEvents, fireHotspots } = useEarthOsStore()

  return (
    <Globe
      earthquakes={earthquakes}
      eonetEvents={eonetEvents}
      fireHotspots={fireHotspots}
    />
  )
}
