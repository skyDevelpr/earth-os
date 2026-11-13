// USGS Earthquake Adapter
// Fetches from /api/earth-os/earthquakes (server proxy)

import type { EarthquakeEvent, DataFreshness, EventSeverity } from '@/types/earth-os'
import type { UsgsFeature } from '../schemas'

function magnitudeToSeverity(mag: number | null): EventSeverity {
  if (mag === null) return 'unknown'
  if (mag < 2.0) return 'low'
  if (mag < 4.0) return 'low'
  if (mag < 5.0) return 'moderate'
  if (mag < 6.0) return 'moderate'
  if (mag < 7.0) return 'high'
  return 'extreme'
}

export function normalizeUsgsFeature(
  feature: UsgsFeature,
  fetchedAt: string,
  freshness: DataFreshness = 'live'
): EarthquakeEvent | null {
  const { properties: p, geometry: g, id } = feature

  if (!g || !p.mag) return null
  const [longitude, latitude, altitude] = g.coordinates

  const mag = p.mag ?? 0
  const observationTime = new Date(p.time).toISOString()
  const lastUpdated = p.updated ? new Date(p.updated).toISOString() : undefined

  return {
    id: `usgs:${id}`,
    provider: 'usgs',
    providerId: id,
    category: 'earthquakes',
    title: p.title ?? `M${mag.toFixed(1)} - ${p.place ?? 'Unknown Location'}`,
    description: p.place ?? undefined,
    geometry: { type: 'Point', coordinates: [longitude, latitude, altitude] },
    coordinates: { longitude, latitude, altitude: altitude / 1000 }, // depth is negative km
    measurement: mag,
    measurementUnit: 'Mw',
    observationTime,
    lastUpdated,
    fetchedAt,
    sourceUrl: p.url ?? undefined,
    severity: magnitudeToSeverity(mag),
    status: 'open',
    freshness,
    magnitude: mag,
    magnitudeType: p.magType ?? 'Mw',
    depth: Math.abs(altitude),
    felt: p.felt ?? undefined,
    cdi: p.cdi ?? undefined,
    mmi: p.mmi ?? undefined,
    alert: p.alert ?? undefined,
    tsunami: p.tsunami === 1,
    sig: p.sig ?? undefined,
    nst: p.nst ?? undefined,
    dmin: p.dmin ?? undefined,
    rms: p.rms ?? undefined,
    gap: p.gap ?? undefined,
    net: p.net ?? undefined,
    usgsUrl: p.url ?? undefined,
    providerData: { raw: { id, properties: p } },
    detectionType: undefined as never,
    sensor: undefined as never,
    satellite: undefined as never,
    acquisitionDate: undefined as never,
    acquisitionTime: undefined as never,
    confidenceLevel: undefined as never,
  } as EarthquakeEvent
}

// Time range options for USGS feeds
export type UsgsTimeRange = 'hour' | 'day' | 'week' | 'month'
export type UsgsMagnitudeFilter = 'all' | 'significant' | '1.0' | '2.5' | '4.5'

export function getUsgsFeedPath(
  timeRange: UsgsTimeRange = 'day',
  magnitudeFilter: UsgsMagnitudeFilter = 'all'
): string {
  const mag = magnitudeFilter === 'significant' ? 'significant' : magnitudeFilter
  return `/${mag}_${timeRange}.geojson`
}
