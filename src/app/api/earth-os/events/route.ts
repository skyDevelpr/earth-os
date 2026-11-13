// Route Handler: /api/earth-os/events
// Server-side proxy for NASA EONET v3

import type { NextRequest } from 'next/server'
import { EonetResponseSchema } from '@/services/earth-os/schemas'
import { normalizeEonetEvent } from '@/services/earth-os/adapters/eonet.adapter'

const EONET_BASE = 'https://eonet.gsfc.nasa.gov/api/v3'

const VALID_CATEGORIES = [
  'wildfires', 'severeStorms', 'volcanoes', 'seaIce',
  'earthquakes', 'drought', 'dustHaze', 'floods',
  'landslides', 'manmade', 'snow', 'tempExtremes', 'waterColor',
]

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const status = searchParams.get('status') ?? 'open'
  const days = parseInt(searchParams.get('days') ?? '7', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)
  const categoryParam = searchParams.get('category')
  const normalize = searchParams.get('normalize') !== 'false'

  // Validate
  if (!['open', 'closed', 'all'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (isNaN(days) || days < 1 || days > 365) {
    return Response.json({ error: 'days must be 1-365' }, { status: 400 })
  }
  if (categoryParam && !VALID_CATEGORIES.includes(categoryParam)) {
    return Response.json({ error: `Invalid category: ${categoryParam}` }, { status: 400 })
  }

  const params = new URLSearchParams({
    status,
    days: String(days),
    limit: String(limit),
  })
  if (categoryParam) params.set('category', categoryParam)

  const url = `${EONET_BASE}/events?${params.toString()}`
  const fetchedAt = new Date().toISOString()

  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(12000),
    })

    if (!upstream.ok) {
      return Response.json(
        { error: `EONET upstream error: ${upstream.status}`, provider: 'eonet', fetchedAt },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const raw = await upstream.json()
    const parsed = EonetResponseSchema.safeParse(raw)

    if (!parsed.success) {
      console.error('[earth-os/events] EONET schema mismatch:', parsed.error.message)
      return Response.json(
        { error: 'Invalid response from NASA EONET', provider: 'eonet', fetchedAt },
        { status: 502, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    const data = parsed.data

    if (normalize) {
      const events = data.events
        .map(e => normalizeEonetEvent(e, fetchedAt, 'live'))
        .filter(Boolean)

      return Response.json(
        {
          events,
          metadata: {
            count: events.length,
            total: data.events.length,
            fetchedAt,
            provider: 'eonet',
            sourceUrl: url,
            freshness: 'live',
          },
        },
        {
          headers: {
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
            'X-Data-Provider': 'NASA-EONET',
            'X-Fetched-At': fetchedAt,
          },
        }
      )
    }

    return Response.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=120',
        'X-Data-Provider': 'NASA-EONET',
        'X-Fetched-At': fetchedAt,
      },
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[earth-os/events] Fetch error:', err)
    return Response.json(
      {
        error: isTimeout ? 'NASA EONET request timed out' : 'Failed to fetch event data',
        provider: 'eonet',
        fetchedAt,
      },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    )
  }
}
