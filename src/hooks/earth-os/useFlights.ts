'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useEarthOsStore } from '@/stores/earth-os'
import type { FlightsApiResponse, LiveFlight } from '@/types/earth-os'

async function fetchLiveFlights(bounds?: { north: number; south: number; west: number; east: number } | null): Promise<FlightsApiResponse> {
  let url = '/api/earth-os/flights?limit=1500'
  if (bounds) {
    url += `&bounds=${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.west.toFixed(4)},${bounds.east.toFixed(4)}`
  }
  const res = await fetch(url)
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}))
    throw new Error(errorJson.error || `HTTP error ${res.status}`)
  }
  return res.json()
}

export function useLiveFlights() {
  const {
    activeModule,
    flightTrackingActive,
    mapBounds,
    setFlights,
    setFlightsLoading,
    setFlightsError,
    setFlightsLastUpdated,
    setFlightProviderInfo,
    clearFlights,
    updateFlightTrail,
    selectedFlight,
    setSelectedFlight,
  } = useEarthOsStore()

  const isEnabled = activeModule === 'flights' && flightTrackingActive

  // Bounded query key so when map moves to new region, fresh data is fetched
  const boundsKey = mapBounds
    ? `${Math.round(mapBounds.north / 5) * 5}_${Math.round(mapBounds.south / 5) * 5}_${Math.round(mapBounds.west / 5) * 5}_${Math.round(mapBounds.east / 5) * 5}`
    : 'global'

  const query = useQuery({
    queryKey: ['earth-os-live-flights', boundsKey],
    queryFn: () => fetchLiveFlights(mapBounds),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 12_000 : false, // 12-second live refresh
    staleTime: 10_000,
    retry: 2,
  })

  // Sync query data into Zustand store
  useEffect(() => {
    if (!isEnabled) {
      if (activeModule !== 'flights') {
        clearFlights()
      }
      return
    }

    setFlightsLoading(query.isLoading)

    if (query.error) {
      setFlightsError(query.error.message)
    } else {
      setFlightsError(null)
    }

    if (query.data) {
      if (query.data.flights) {
        setFlights(query.data.flights)
      }
      setFlightsLastUpdated(query.data.timestamp)
      setFlightProviderInfo({
        provider: query.data.provider,
        fr24Configured: query.data.fr24Configured,
        attribution: query.data.attribution,
        timestamp: query.data.timestamp,
        setupGuide: query.data.setupGuide,
      })

      // Update position trail for selected flight
      if (selectedFlight) {
        const updated = query.data.flights?.find(f => f.icao24 === selectedFlight.icao24)
        if (updated) {
          setSelectedFlight(updated)
          updateFlightTrail(updated.icao24, [updated.longitude, updated.latitude])
        }
      }
    }
  }, [
    isEnabled,
    activeModule,
    query.data,
    query.isLoading,
    query.error,
    selectedFlight?.icao24,
    setFlights,
    setFlightsLoading,
    setFlightsError,
    setFlightsLastUpdated,
    setFlightProviderInfo,
    clearFlights,
    updateFlightTrail,
    setSelectedFlight,
  ])

  return query
}
