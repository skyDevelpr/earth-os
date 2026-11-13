'use client'

import EarthOsProviders from './earth-os/providers'
import EarthOsApp from './earth-os/page'

export default function RootEarthOsPage() {
  return (
    <EarthOsProviders>
      <EarthOsApp />
    </EarthOsProviders>
  )
}
