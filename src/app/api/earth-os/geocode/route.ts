// Route Handler: /api/earth-os/geocode
// Free geocoding using Nominatim (OpenStreetMap) with rate-limit awareness

import type { NextRequest } from 'next/server'

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q')
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  const fetchedAt = new Date().toISOString()

  // Forward geocoding
  if (q && q.trim().length > 0) {
    if (q.length > 200) {
      return Response.json({ error: 'Query too long' }, { status: 400 })
    }

    const params = new URLSearchParams({
      q: q.trim(),
      format: 'geocodejson',
      limit: '5',
      addressdetails: '1',
    })

    try {
      const upstream = await fetch(`${NOMINATIM_BASE}/search?${params.toString()}`, {
        headers: {
          // Nominatim requires a valid User-Agent
          'User-Agent': 'EARTH-OS/1.0 (Planetary Intelligence Platform; educational)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!upstream.ok) {
        return Response.json(
          { error: `Geocoding error: ${upstream.status}`, fetchedAt },
          { status: 502 }
        )
      }

      const data = await upstream.json()

      return Response.json(
        { data, fetchedAt, provider: 'nominatim' },
        {
          headers: {
            'Cache-Control': 'public, max-age=86400', // Geocoding results can be cached 24h
            'X-Data-Provider': 'Nominatim-OSM',
          },
        }
      )
    } catch (err) {
      console.error('[earth-os/geocode] Error:', err)
      return Response.json(
        { error: 'Geocoding service unavailable', fetchedAt },
        { status: 503 }
      )
    }
  }

  // Reverse geocoding
  if (lat && lon) {
    const latN = parseFloat(lat)
    const lonN = parseFloat(lon)

    if (isNaN(latN) || isNaN(lonN)) {
      return Response.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const params = new URLSearchParams({
      lat: String(latN),
      lon: String(lonN),
      format: 'geocodejson',
      addressdetails: '1',
    })

    try {
      const upstream = await fetch(`${NOMINATIM_BASE}/reverse?${params.toString()}`, {
        headers: {
          'User-Agent': 'EARTH-OS/1.0 (Planetary Intelligence Platform; educational)',
          'Accept-Language': 'en',
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!upstream.ok) {
        return Response.json(
          { error: `Reverse geocoding error: ${upstream.status}`, fetchedAt },
          { status: 502 }
        )
      }

      const data = await upstream.json()
      return Response.json(
        { data, fetchedAt, provider: 'nominatim' },
        { headers: { 'Cache-Control': 'public, max-age=86400' } }
      )
    } catch (err) {
      console.error('[earth-os/geocode/reverse] Error:', err)
      return Response.json({ error: 'Reverse geocoding unavailable', fetchedAt }, { status: 503 })
    }
  }

  return Response.json(
    { error: 'Provide either q (search query) or lat+lon (reverse geocode)' },
    { status: 400 }
  )
}
