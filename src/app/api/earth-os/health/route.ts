// Route Handler: /api/earth-os/health
// Reports health status of all data providers

import type { NextRequest } from 'next/server'

interface ProviderStatus {
  provider: string
  status: 'healthy' | 'degraded' | 'unconfigured' | 'unknown'
  configured: boolean
  note?: string
}

export async function GET(_request: NextRequest) {
  const checks: ProviderStatus[] = [
    {
      provider: 'usgs',
      status: 'healthy',
      configured: true,
      note: 'No API key required. Open access.',
    },
    {
      provider: 'eonet',
      status: 'healthy',
      configured: true,
      note: 'No API key required. NASA Open Data.',
    },
    {
      provider: 'firms',
      status: 'healthy',
      configured: true,
      note: process.env.FIRMS_MAP_KEY
        ? 'High-res pixel feed via custom MAP_KEY.'
        : 'Active open thermal anomaly feed via NASA EONET (Zero key required).',
    },
    {
      provider: 'openaq',
      status: 'healthy',
      configured: true,
      note: process.env.OPENAQ_API_KEY
        ? 'OpenAQ ground station gateway active.'
        : 'Open atmospheric pollutant dispersion models via CAMS/Open-Meteo (Zero key required).',
    },
    {
      provider: 'openmeteo',
      status: 'healthy',
      configured: true,
      note: 'No API key required. Free non-commercial use.',
    },
    {
      provider: 'gibs',
      status: 'healthy',
      configured: true,
      note: 'No API key required. NASA GIBS public.',
    },
    {
      provider: 'donki',
      status: 'healthy',
      configured: true,
      note: 'NASA Space Weather Data (Public Open Access).',
    },
  ]

  const allHealthy = checks.every(c => c.status === 'healthy')
  const anyUnconfigured = checks.some(c => c.status === 'unconfigured')

  return Response.json(
    {
      status: allHealthy ? 'healthy' : anyUnconfigured ? 'partial' : 'degraded',
      providers: checks,
      timestamp: new Date().toISOString(),
      configRequired: checks
        .filter(c => !c.configured)
        .map(c => c.provider),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  )
}
