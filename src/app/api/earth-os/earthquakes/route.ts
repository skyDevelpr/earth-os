// Route Handler: /api/earth-os/earthquakes
// Server-side proxy for USGS Earthquake Catalog
// Keeps API calls server-side, enables caching, hides rate-limit headers from browser

import type { NextRequest } from 'next/server'
import { UsgsGeoJsonSchema } from '@/services/earth-os/schemas'
import { normalizeUsgsFeature } from '@/services/earth-os/adapters/usgs.adapter'

const USGS_BASE = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary'

// Valid USGS feed combinations
const VALID_TIMERANGES = ['hour', 'day', 'week', 'month'] as const
const VALID_MAGNITUDES = ['all', 'significant', '1.0', '2.5', '4.5'] as const

type TimeRange = typeof VALID_TIMERANGES[number]
type MagnitudeFilter = typeof VALID_MAGNITUDES[number]

function buildUsgsUrl(timeRange: TimeRange, magnitude: MagnitudeFilter): string {
  if (magnitude === 'significant') {
    return `${USGS_BASE}/significant_${timeRange}.geojson`
  }
  return `${USGS_BASE}/${magnitude}_${timeRange}.geojson`
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const timeRange = (searchParams.get('timeRange') ?? 'day') as TimeRange
  const magnitude = (searchParams.get('magnitude') ?? 'all') as MagnitudeFilter
  const normalize = searchParams.get('normalize') !== 'false'

  // Validate inputs
  if (!VALID_TIMERANGES.includes(timeRange)) {
    return Response.json(
      { error: 'Invalid timeRange. Valid values: hour, day, week, month' },
      { status: 400 }
    )
  }
  if (!VALID_MAGNITUDES.includes(magnitude)) {
    return Response.json(
      { error: 'Invalid magnitude filter.' },
      { status: 400 }
    )
  }

  const url = buildUsgsUrl(timeRange, magnitude)
  const fetchedAt = new Date().toISOString()

  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/geo+json,application/json' },
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!upstream.ok) {
      return Response.json(
        {
          error: `USGS upstream error: ${upstream.status}`,
          provider: 'usgs',
          fetchedAt,
        },
        {
          status: 502,
          headers: { 'Cache-Control': 'no-store' },
        }
      )
    }

    const raw = await upstream.json()

    // Validate response schema
    const parsed = UsgsGeoJsonSchema.safeParse(raw)
    if (!parsed.success) {
      console.error('[earth-os/earthquakes] Schema validation failed:', parsed.error.message)
      return Response.json(
        { error: 'Invalid response from USGS', provider: 'usgs', fetchedAt },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const data = parsed.data

    if (normalize) {
      const events = data.features
        .map(f => normalizeUsgsFeature(f, fetchedAt, 'live'))
        .filter(Boolean)

      return Response.json(
        {
          events,
          metadata: {
            count: events.length,
            total: data.metadata.count,
            generated: new Date(data.metadata.generated).toISOString(),
            fetchedAt,
            provider: 'usgs',
            sourceUrl: url,
            freshness: 'live',
          },
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
            'X-Data-Provider': 'USGS',
            'X-Fetched-At': fetchedAt,
          },
        }
      )
    }

    // Return raw for special use cases
    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=60',
        'X-Data-Provider': 'USGS',
        'X-Fetched-At': fetchedAt,
      },
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[earth-os/earthquakes] Fetch error:', err)

    return Response.json(
      {
        error: isTimeout ? 'USGS request timed out' : 'Failed to fetch earthquake data',
        provider: 'usgs',
        fetchedAt,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
