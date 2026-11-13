import type { Metadata } from 'next'
import EarthOsProviders from './providers'
import '../../app/globals.css'
import './earth-os.css'

export const metadata: Metadata = {
  title: 'EARTH OS — Planetary Intelligence Platform',
  description: 'Understand Everything Happening on Earth. Real-time planetary data, satellite imagery, and environmental intelligence.',
  robots: 'index, follow',
}

export default function EarthOsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <head>
        <link
          rel="stylesheet"
          href="/maplibre-gl.css"
        />
      </head>
      <EarthOsProviders>
        {children}
      </EarthOsProviders>
    </>
  )
}
