// Custom hooks for EARTH OS data fetching
// Uses TanStack Query for caching, deduplication, stale-while-revalidate

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEarthOsStore } from '@/stores/earth-os'
import type { EarthquakeEvent, UnifiedEvent, FireDetectionEvent } from '@/types/earth-os'
import type { EventTimeRange } from '@/stores/earth-os'

// ─── Earthquake Data ───────────────────────────────────────────────────────

export function useEarthquakes(timeRange: EventTimeRange = 'day', minMag: number = 0) {
  const setEarthquakes = useEarthOsStore(s => s.setEarthquakes)
  const setProviderHealth = useEarthOsStore(s => s.setProviderHealth)

  return useQuery({
    queryKey: ['earthquakes', timeRange, minMag],
    queryFn: async (): Promise<EarthquakeEvent[]> => {
      const magFilter = minMag >= 4.5 ? '4.5' : minMag >= 2.5 ? '2.5' : minMag >= 1.0 ? '1.0' : 'all'
      const params = new URLSearchParams({
        timeRange,
        magnitude: magFilter,
        normalize: 'true',
      })

      const res = await fetch(`/api/earth-os/earthquakes?${params.toString()}`)

      if (!res.ok) {
        setProviderHealth('usgs', { status: 'degraded', lastError: new Date().toISOString() })
        throw new Error(`Earthquake API error: ${res.status}`)
      }

      const json = await res.json()
      const events: EarthquakeEvent[] = json.events ?? []

      // Filter by magnitude client-side for finer control
      const filtered = minMag > 0
        ? events.filter(e => e.magnitude >= minMag)
        : events

      setEarthquakes(filtered)
      setProviderHealth('usgs', { status: 'healthy', lastSuccessful: new Date().toISOString() })
      return filtered
    },
    staleTime: 2 * 60 * 1000,         // 2 min — earthquakes update frequently
    gcTime: 10 * 60 * 1000,
    refetchInterval: 2 * 60 * 1000,   // Poll every 2 min for live data
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  })
}

// ─── EONET Events ──────────────────────────────────────────────────────────

export function useEonetEvents(days: number = 7, category?: string) {
  const setEonetEvents = useEarthOsStore(s => s.setEonetEvents)
  const setProviderHealth = useEarthOsStore(s => s.setProviderHealth)

  return useQuery({
    queryKey: ['eonet', days, category],
    queryFn: async (): Promise<UnifiedEvent[]> => {
      const params = new URLSearchParams({
        status: 'open',
        days: String(days),
        limit: '100',
        normalize: 'true',
      })
      if (category) params.set('category', category)

      const res = await fetch(`/api/earth-os/events?${params.toString()}`)

      if (!res.ok) {
        setProviderHealth('eonet', { status: 'degraded', lastError: new Date().toISOString() })
        throw new Error(`EONET API error: ${res.status}`)
      }

      const json = await res.json()
      const events: UnifiedEvent[] = json.events ?? []

      setEonetEvents(events)
      setProviderHealth('eonet', { status: 'healthy', lastSuccessful: new Date().toISOString() })
      return events
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  })
}

// ─── Fire Hotspots ──────────────────────────────────────────────────────────

export function useFireHotspots(options?: { product?: string; days?: number; bbox?: string }) {
  const setFireHotspots = useEarthOsStore(s => s.setFireHotspots)
  const setProviderHealth = useEarthOsStore(s => s.setProviderHealth)

  const { product = 'VIIRS_SNPP_NRT', days = 1, bbox } = options ?? {}

  return useQuery({
    queryKey: ['fires', product, days, bbox],
    queryFn: async (): Promise<FireDetectionEvent[]> => {
      const params = new URLSearchParams({ product, days: String(days) })
      if (bbox) params.set('bbox', bbox)

      const res = await fetch(`/api/earth-os/fires?${params.toString()}`)

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        // If FIRMS isn't configured, degrade gracefully
        if (json.configRequired) {
          setProviderHealth('firms', { status: 'down', lastError: 'MAP_KEY not configured' })
          return []
        }
        setProviderHealth('firms', { status: 'degraded', lastError: new Date().toISOString() })
        throw new Error(`FIRMS API error: ${res.status}`)
      }

      const json = await res.json()
      const hotspots: FireDetectionEvent[] = json.hotspots ?? []

      setFireHotspots(hotspots)
      setProviderHealth('firms', { status: 'healthy', lastSuccessful: new Date().toISOString() })
      return hotspots
    },
    staleTime: 10 * 60 * 1000,         // 10 min
    gcTime: 60 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
    retryDelay: 5000,
  })
}

// ─── Weather Data ──────────────────────────────────────────────────────────

export function useWeather(lat: number, lon: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['weather', lat.toFixed(2), lon.toFixed(2)],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'weather',
        lat: String(lat),
        lon: String(lon),
      })
      const res = await fetch(`/api/earth-os/atmosphere?${params.toString()}`)
      if (!res.ok) throw new Error(`Weather API error: ${res.status}`)
      return res.json()
    },
    enabled: enabled && !isNaN(lat) && !isNaN(lon),
    staleTime: 30 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 2,
  })
}

// ─── Air Quality Data ──────────────────────────────────────────────────────

export function useAirQuality(lat: number, lon: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['airquality', lat.toFixed(2), lon.toFixed(2)],
    queryFn: async () => {
      const params = new URLSearchParams({
        type: 'airquality',
        lat: String(lat),
        lon: String(lon),
      })
      const res = await fetch(`/api/earth-os/atmosphere?${params.toString()}`)
      if (!res.ok) throw new Error(`Air Quality API error: ${res.status}`)
      return res.json()
    },
    enabled: enabled && !isNaN(lat) && !isNaN(lon),
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
  })
}

// ─── Provider Health ──────────────────────────────────────────────────────

export function useProviderHealth() {
  return useQuery({
    queryKey: ['provider-health'],
    queryFn: async () => {
      const res = await fetch('/api/earth-os/health')
      if (!res.ok) throw new Error('Health check failed')
      return res.json()
    },
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  })
}

// ─── Geocode Search ───────────────────────────────────────────────────────

export function useGeocode(query: string) {
  return useQuery({
    queryKey: ['geocode', query],
    queryFn: async () => {
      if (!query.trim()) return { data: { features: [] } }
      const params = new URLSearchParams({ q: query.trim() })
      const res = await fetch(`/api/earth-os/geocode?${params.toString()}`)
      if (!res.ok) throw new Error('Geocoding failed')
      return res.json()
    },
    enabled: query.trim().length >= 2,
    staleTime: 24 * 60 * 60 * 1000,  // 24h — locations don't change
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  })
}

// ─── Live Planetary News Feed ──────────────────────────────────────────────

export function usePlanetaryNews(options?: {
  query?: string
  category?: string
  location?: string
  limit?: number
}) {
  const { query, category, location, limit = 20 } = options ?? {}

  return useQuery({
    queryKey: ['planetary-news', query, category, location, limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (query) params.set('q', query)
      if (category && category !== 'all') params.set('category', category)
      if (location) params.set('location', location)
      if (limit) params.set('limit', String(limit))

      const res = await fetch(`/api/earth-os/news?${params.toString()}`)
      if (!res.ok) throw new Error(`News API error: ${res.status}`)
      const json = await res.json()
      return json.articles ?? []
    },
    staleTime: 3 * 60 * 1000,        // 3 min
    gcTime: 15 * 60 * 1000,
    refetchInterval: 4 * 60 * 1000,  // Refetch every 4 min
    retry: 1,
  })
}

