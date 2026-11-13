// Intelligent Event Correlation Layer for EARTH OS
// Calculates spatial-temporal relationships between natural phenomena
// Strictly avoids presenting coincidence as causation; relies exclusively on physical distance and time proximity

import type { UnifiedEvent, EarthquakeEvent, FireDetectionEvent } from '@/types/earth-os'

export interface CorrelatedItem<T = UnifiedEvent> {
  event: T
  distanceKm: number
  timeDeltaHours: number
  relationship: 'foreshock' | 'aftershock' | 'cluster_member' | 'regional_proximity' | 'environmental_context'
  confidence: number // 0 to 1
  description: string
}

export interface CorrelationResult {
  targetEventId: string
  nearbyEarthquakes: CorrelatedItem<EarthquakeEvent>[]
  nearbyVolcanoes: CorrelatedItem<UnifiedEvent>[]
  nearbyHazards: CorrelatedItem<UnifiedEvent | FireDetectionEvent>[]
  tectonicContext?: string
  totalCorrelatedCount: number
}

// Great-circle distance using Haversine formula
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export function findCorrelations(
  target: UnifiedEvent | EarthquakeEvent | FireDetectionEvent,
  earthquakes: EarthquakeEvent[],
  eonetEvents: UnifiedEvent[],
  fires: FireDetectionEvent[]
): CorrelationResult {
  const targetLat = target.coordinates.latitude
  const targetLon = target.coordinates.longitude
  const targetTime = new Date(target.observationTime).getTime()

  const nearbyEarthquakes: CorrelatedItem<EarthquakeEvent>[] = []
  const nearbyVolcanoes: CorrelatedItem<UnifiedEvent>[] = []
  const nearbyHazards: CorrelatedItem<UnifiedEvent | FireDetectionEvent>[] = []

  // 1. Correlate nearby seismic events (within 400km and within 7 days)
  earthquakes.forEach((eq) => {
    if (eq.id === target.id) return
    const dist = calculateHaversineDistanceKm(targetLat, targetLon, eq.coordinates.latitude, eq.coordinates.longitude)

    if (dist <= 400) {
      const eqTime = new Date(eq.observationTime).getTime()
      const deltaHours = Math.round((eqTime - targetTime) / (1000 * 3600))

      if (Math.abs(deltaHours) <= 168) { // within 7 days
        let rel: CorrelatedItem['relationship'] = 'cluster_member'
        let desc = ''

        if (target.category === 'earthquakes') {
          const targetMag = (target as EarthquakeEvent).magnitude ?? 0
          if (deltaHours > 0 && deltaHours <= 72 && eq.magnitude <= targetMag) {
            rel = 'aftershock'
            desc = `Possible aftershock (M${eq.magnitude.toFixed(1)}) ${deltaHours}h later`
          } else if (deltaHours < 0 && Math.abs(deltaHours) <= 72 && eq.magnitude <= targetMag) {
            rel = 'foreshock'
            desc = `Preceding seismic event (M${eq.magnitude.toFixed(1)}) ${Math.abs(deltaHours)}h prior`
          } else {
            rel = 'cluster_member'
            desc = `Regional seismic activity (M${eq.magnitude.toFixed(1)})`
          }
        } else {
          rel = 'regional_proximity'
          desc = `Regional seismic event (M${eq.magnitude.toFixed(1)})`
        }

        nearbyEarthquakes.push({
          event: eq,
          distanceKm: dist,
          timeDeltaHours: deltaHours,
          relationship: rel,
          confidence: Math.max(0.3, Math.min(0.95, 1 - dist / 400)),
          description: desc,
        })
      }
    }
  })

  // Sort by closest distance
  nearbyEarthquakes.sort((a, b) => a.distanceKm - b.distanceKm)

  // 2. Correlate active volcanoes (within 600km)
  eonetEvents
    .filter((e) => e.category === 'volcanoes' && e.id !== target.id)
    .forEach((vol) => {
      const dist = calculateHaversineDistanceKm(targetLat, targetLon, vol.coordinates.latitude, vol.coordinates.longitude)
      if (dist <= 600) {
        nearbyVolcanoes.push({
          event: vol,
          distanceKm: dist,
          timeDeltaHours: 0,
          relationship: 'environmental_context',
          confidence: Math.max(0.4, 1 - dist / 600),
          description: `Active volcanic center within ${dist}km`,
        })
      }
    })

  nearbyVolcanoes.sort((a, b) => a.distanceKm - b.distanceKm)

  // 3. Correlate storms / wildfires / other natural hazards (within 350km)
  eonetEvents
    .filter((e) => e.category !== 'volcanoes' && e.id !== target.id)
    .forEach((evt) => {
      const dist = calculateHaversineDistanceKm(targetLat, targetLon, evt.coordinates.latitude, evt.coordinates.longitude)
      if (dist <= 350) {
        nearbyHazards.push({
          event: evt,
          distanceKm: dist,
          timeDeltaHours: 0,
          relationship: 'regional_proximity',
          confidence: Math.max(0.35, 1 - dist / 350),
          description: `Co-located ${evt.category} event (${dist}km)`,
        })
      }
    })

  // Add nearby thermal anomalies
  fires.forEach((fire) => {
    if (fire.id === target.id) return
    const dist = calculateHaversineDistanceKm(targetLat, targetLon, fire.coordinates.latitude, fire.coordinates.longitude)
    if (dist <= 250) {
      nearbyHazards.push({
        event: fire,
        distanceKm: dist,
        timeDeltaHours: 0,
        relationship: 'regional_proximity',
        confidence: Math.max(0.3, 1 - dist / 250),
        description: `Thermal anomaly detected (${dist}km, ${fire.fireRadiativePower ? `${fire.fireRadiativePower.toFixed(0)}MW` : 'VIIRS'})`,
      })
    }
  })

  nearbyHazards.sort((a, b) => a.distanceKm - b.distanceKm)

  // Determine tectonic context
  let tectonicContext = 'Intraplate or passive continental margin'
  if (nearbyVolcanoes.length > 0 || nearbyEarthquakes.length >= 3) {
    tectonicContext = 'Active plate boundary / convergent or subduction zone'
  } else if (target.category === 'earthquakes' && (target as EarthquakeEvent).depth > 100) {
    tectonicContext = 'Deep subduction slab (Benioff zone)'
  }

  return {
    targetEventId: target.id,
    nearbyEarthquakes: nearbyEarthquakes.slice(0, 5),
    nearbyVolcanoes: nearbyVolcanoes.slice(0, 3),
    nearbyHazards: nearbyHazards.slice(0, 5),
    tectonicContext,
    totalCorrelatedCount: nearbyEarthquakes.length + nearbyVolcanoes.length + nearbyHazards.length,
  }
}
