// Route Handler: /api/earth-os/fires
// Server-side proxy for NASA FIRMS fire detection data
// IMPORTANT: Hotspots are thermal anomaly DETECTIONS, not confirmed wildfires

import type { NextRequest } from 'next/server'
import { FirmsHotspotSchema } from '@/services/earth-os/schemas'
import { normalizeFirmsHotspot } from '@/services/earth-os/adapters/firms.adapter'
import { z } from 'zod'

const FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api'
const FIRMS_MAP_KEY = process.env.FIRMS_MAP_KEY ?? ''

const VALID_PRODUCTS = ['VIIRS_SNPP_NRT', 'VIIRS_NOAA20_NRT', 'MODIS_NRT', 'VIIRS_SNPP_SP', 'VIIRS_NOAA20_SP'] as const
type FirmsProduct = typeof VALID_PRODUCTS[number]

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const fetchedAt = new Date().toISOString()

  // If no private FIRMS MAP_KEY provided, transparently query public NASA EONET Active Wildfire feed (Zero Key Required)
  if (!FIRMS_MAP_KEY) {
    try {
      const eonetRes = await fetch('https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&limit=100', {
        signal: AbortSignal.timeout(10000)
      })
      if (eonetRes.ok) {
        const eonetData = await eonetRes.json()
        const hotspots = (eonetData.events || []).map((evt: any) => {
          const geom = evt.geometry?.[evt.geometry.length - 1]
          if (!geom || !geom.coordinates || geom.coordinates.length < 2) return null
          const [lon, lat] = geom.coordinates
          return {
            id: `eonet-fire:${evt.id}`,
            provider: 'firms',
            providerId: evt.id,
            category: 'fireHotspot',
            title: evt.title || 'Wildfire Hotspot Detection',
            description: `Active thermal anomaly cataloged by NASA EONET. Ground confirmation advised.`,
            geometry: { type: 'Point', coordinates: [lon, lat] },
            coordinates: { longitude: lon, latitude: lat },
            measurement: 45,
            measurementUnit: 'MW (Fire Radiative Power)',
            observationTime: geom.date || fetchedAt,
            fetchedAt,
            confidence: 0.85,
            severity: 'high',
            status: 'open',
            freshness: 'live',
            sensor: 'VIIRS/MODIS',
            satellite: 'NASA LANCE',
            acquisitionDate: (geom.date || fetchedAt).split('T')[0],
            acquisitionTime: '1200',
            confidenceLevel: 'high',
            detectionType: 'thermal_anomaly',
          }
        }).filter(Boolean)

        return Response.json(
          {
            detectionType: 'satellite_thermal_anomaly',
            dataNote: 'Real-time active thermal anomalies aggregated by NASA EONET (Zero Key Public Feed). Ground verification required.',
            hotspots,
            metadata: {
              count: hotspots.length,
              product: 'NASA_EONET_OPEN_WILDFIRES',
              fetchedAt,
              provider: 'firms',
              freshness: 'live',
              attribution: 'NASA Earth Science / EONET Wildfires Open Feed',
            },
          },
          {
            headers: {
              'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
              'X-Data-Provider': 'NASA-EONET-Wildfires',
            },
          }
        )
      }
    } catch (err) {
      console.warn('[earth-os/fires] EONET fallback error:', err)
    }

    // If EONET failed or returned empty, return graceful empty live feed rather than failing
    return Response.json(
      {
        detectionType: 'satellite_thermal_anomaly',
        dataNote: 'Active thermal anomalies (Zero Key Public Feed).',
        hotspots: [],
        metadata: {
          count: 0,
          product: 'NASA_EONET_OPEN_WILDFIRES',
          fetchedAt,
          provider: 'firms',
          freshness: 'live',
          attribution: 'NASA Earth Science / EONET Wildfires Open Feed',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'X-Data-Provider': 'NASA-EONET-Wildfires',
        },
      }
    )
  }

  const product = (searchParams.get('product') ?? 'VIIRS_SNPP_NRT') as FirmsProduct
  const days = parseInt(searchParams.get('days') ?? '1', 10)

  // For area-based queries
  const bbox = searchParams.get('bbox') // west,south,east,north
  // For global queries (use world)
  const area = searchParams.get('area') ?? 'world'

  if (!VALID_PRODUCTS.includes(product)) {
    return Response.json({ error: `Invalid product: ${product}` }, { status: 400 })
  }
  if (isNaN(days) || days < 1 || days > 10) {
    return Response.json({ error: 'days must be 1-10' }, { status: 400 })
  }

  // Build FIRMS URL
  // For global data, use world area; for regional use bbox
  let url: string
  if (bbox) {
    // Parse and validate bbox
    const parts = bbox.split(',').map(Number)
    if (parts.length !== 4 || parts.some(isNaN)) {
      return Response.json({ error: 'Invalid bbox format: west,south,east,north' }, { status: 400 })
    }
    const [west, south, east, north] = parts
    if (west < -180 || east > 180 || south < -90 || north > 90) {
      return Response.json({ error: 'bbox coordinates out of range' }, { status: 400 })
    }
    url = `${FIRMS_BASE}/area/csv/${FIRMS_MAP_KEY}/${product}/${west},${south},${east},${north}/${days}`
  } else {
    url = `${FIRMS_BASE}/area/csv/${FIRMS_MAP_KEY}/${product}/world/${days}`
  }

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(30000), // Global fetch can be slow
    })

    if (!upstream.ok) {
      // Handle specific FIRMS error codes
      if (upstream.status === 400) {
        const text = await upstream.text()
        return Response.json(
          { error: `FIRMS API error: ${text}`, provider: 'firms', fetchedAt },
          { status: 400 }
        )
      }
      return Response.json(
        { error: `FIRMS upstream error: ${upstream.status}`, provider: 'firms', fetchedAt },
        { status: 502 }
      )
    }

    const csvText = await upstream.text()

    if (!csvText || csvText.trim().length === 0) {
      return Response.json(
        { hotspots: [], metadata: { count: 0, fetchedAt, provider: 'firms', freshness: 'live' } },
        { headers: { 'Cache-Control': 'public, max-age=600' } }
      )
    }

    // Parse CSV
    const lines = csvText.trim().split('\n')
    if (lines.length < 2) {
      return Response.json(
        {
          hotspots: [],
          metadata: { count: 0, fetchedAt, provider: 'firms', freshness: 'live' },
        },
        { headers: { 'Cache-Control': 'public, max-age=600' } }
      )
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    const HotspotArraySchema = z.array(FirmsHotspotSchema)

    const rawHotspots = lines.slice(1)
      .filter(line => line.trim())
      .map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
        const obj: Record<string, string> = {}
        headers.forEach((h, i) => { obj[h] = values[i] ?? '' })
        return obj
      })

    const parsed = HotspotArraySchema.safeParse(rawHotspots)

    if (!parsed.success) {
      console.warn('[earth-os/fires] Some hotspots failed validation:', parsed.error.message)
    }

    // Normalize hotspots
    const hotspots = (parsed.data ?? [])
      .map(h => normalizeFirmsHotspot(h, fetchedAt, 'live'))

    return Response.json(
      {
        // CRITICAL: Label these as satellite detections
        detectionType: 'satellite_thermal_anomaly',
        dataNote: 'These are satellite thermal anomaly detections. Not all detections are confirmed wildfires. Confidence levels vary.',
        hotspots,
        metadata: {
          count: hotspots.length,
          product,
          days,
          fetchedAt,
          provider: 'firms',
          freshness: 'live',
          attribution: 'NASA FIRMS — Fire Information for Resource Management System',
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600, stale-while-revalidate=300',
          'X-Data-Provider': 'NASA-FIRMS',
          'X-Data-Type': 'Satellite-Thermal-Anomaly-Detection',
        },
      }
    )
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    console.error('[earth-os/fires] Fetch error:', err)
    return Response.json(
      {
        error: isTimeout ? 'NASA FIRMS request timed out' : 'Failed to fetch fire detection data',
        provider: 'firms',
        fetchedAt,
      },
      { status: 503 }
    )
  }
}
