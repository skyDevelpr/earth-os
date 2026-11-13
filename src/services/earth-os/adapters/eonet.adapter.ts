// NASA EONET Adapter
// Normalizes EONET v3 events to UnifiedEvent model

import type { UnifiedEvent, EventCategory, EventSeverity, DataFreshness } from '@/types/earth-os'
import type { EonetEvent, EonetGeometry } from '../schemas'

// Map EONET category IDs to our internal categories
const EONET_CATEGORY_MAP: Record<string, EventCategory> = {
  wildfires: 'wildfires',
  severeStorms: 'severeStorms',
  volcanoes: 'volcanoes',
  seaIce: 'seaIce',
  earthquakes: 'earthquakes',
  drought: 'drought',
  dustHaze: 'dustHaze',
  floods: 'floods',
  landslides: 'other',
  manmade: 'manmade',
  snow: 'snow',
  tempExtremes: 'temperatureExtremes',
  waterColor: 'waterColor',
}

function eonetCategoryToInternal(categoryId: string): EventCategory {
  return EONET_CATEGORY_MAP[categoryId] ?? 'other'
}

function getMostRecentGeometry(geometries: EonetGeometry[]): EonetGeometry | null {
  if (!geometries.length) return null
  return geometries.reduce((latest, g) => {
    return new Date(g.date) > new Date(latest.date) ? g : latest
  })
}

function extractCoordinates(geometry: EonetGeometry): [number, number] | null {
  const coords = geometry.coordinates
  if (Array.isArray(coords) && coords.length >= 2) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      return [coords[0] as number, coords[1] as number]
    }
  }
  return null
}

function magnitudeToSeverity(value: number | null | undefined, unit: string | null | undefined): EventSeverity {
  if (!value) return 'unknown'
  if (unit === 'Richter' || unit === 'Mw') {
    if (value >= 7.0) return 'extreme'
    if (value >= 5.0) return 'high'
    if (value >= 3.0) return 'moderate'
    return 'low'
  }
  return 'unknown'
}

export function normalizeEonetEvent(
  event: EonetEvent,
  fetchedAt: string,
  freshness: DataFreshness = 'live'
): UnifiedEvent | null {
  const latestGeometry = getMostRecentGeometry(event.geometry)
  if (!latestGeometry) return null

  const coords = extractCoordinates(latestGeometry)
  if (!coords) return null

  const [longitude, latitude] = coords
  const category = eonetCategoryToInternal(event.categories[0]?.id ?? 'other')
  const sourceUrl = event.sources[0]?.url ?? event.link

  return {
    id: `eonet:${event.id}`,
    provider: 'eonet',
    providerId: event.id,
    category,
    title: event.title,
    description: event.description ?? undefined,
    geometry: { type: 'Point', coordinates: [longitude, latitude] },
    coordinates: { longitude, latitude },
    measurement: latestGeometry.magnitudeValue ?? undefined,
    measurementUnit: latestGeometry.magnitudeUnit ?? undefined,
    observationTime: latestGeometry.date,
    fetchedAt,
    sourceUrl: sourceUrl ?? undefined,
    severity: magnitudeToSeverity(latestGeometry.magnitudeValue, latestGeometry.magnitudeUnit),
    status: event.closed ? 'closed' : 'open',
    freshness,
    providerData: {
      categories: event.categories,
      sources: event.sources,
      geometryCount: event.geometry.length,
      allGeometries: event.geometry,
    },
  }
}
