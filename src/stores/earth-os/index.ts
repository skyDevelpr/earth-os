// Earth OS — Main Zustand Store
// All module state lives here

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type {
  ModuleId,
  UnifiedEvent,
  EarthquakeEvent,
  FireDetectionEvent,
  LayerId,
  GlobeCameraState,
  ProviderHealth,
  DataProvider,
  SearchResult,
  GeographicPoi,
  LiveFlight,
} from '@/types/earth-os'

export type EventTimeRange = 'hour' | 'day' | 'week' | 'month'
export type MapMode = 'globe' | 'satellite' | 'hybrid' | 'terrain'
export type ThemeMode = 'dark' | 'light' | 'system'
export type UserLocationStatus = 'idle' | 'requesting' | 'located' | 'denied' | 'error'

export interface EarthOsState {
  // ─── Module Navigation ─────────────────────────────────────────────
  activeModule: ModuleId
  setActiveModule: (module: ModuleId) => void

  // ─── Globe State ───────────────────────────────────────────────────
  globeCamera: GlobeCameraState
  setGlobeCamera: (camera: Partial<GlobeCameraState>) => void
  isFullscreen: boolean
  setFullscreen: (v: boolean) => void
  globeReady: boolean
  setGlobeReady: (v: boolean) => void

  // ─── Map Mode (Globe / Satellite / Hybrid / Terrain) ───────────────
  mapMode: MapMode
  setMapMode: (mode: MapMode) => void

  // ─── Theme Appearance (Dark / Light / System) ──────────────────────
  themeMode: ThemeMode
  setThemeMode: (theme: ThemeMode) => void

  // ─── User Location ─────────────────────────────────────────────────
  userLocation: { coords: [number, number]; accuracy: number } | null
  userLocationStatus: UserLocationStatus
  userLocationError: string | null
  setUserLocation: (loc: { coords: [number, number]; accuracy: number } | null) => void
  setUserLocationStatus: (status: UserLocationStatus, error?: string | null) => void

  // ─── Layer Visibility ──────────────────────────────────────────────
  activeLayers: Set<LayerId>
  toggleLayer: (layer: LayerId) => void
  setLayerVisible: (layer: LayerId, visible: boolean) => void

  // ─── Event Data ────────────────────────────────────────────────────
  earthquakes: EarthquakeEvent[]
  setEarthquakes: (events: EarthquakeEvent[]) => void
  eonetEvents: UnifiedEvent[]
  setEonetEvents: (events: UnifiedEvent[]) => void
  fireHotspots: FireDetectionEvent[]
  setFireHotspots: (hotspots: FireDetectionEvent[]) => void

  // ─── Event Filtering ───────────────────────────────────────────────
  eventTimeRange: EventTimeRange
  setEventTimeRange: (range: EventTimeRange) => void
  minMagnitude: number
  setMinMagnitude: (mag: number) => void
  activeCategories: Set<string>
  toggleCategory: (category: string) => void

  // ─── Event & POI Selection ─────────────────────────────────────────
  selectedEvent: UnifiedEvent | EarthquakeEvent | FireDetectionEvent | null
  setSelectedEvent: (event: UnifiedEvent | EarthquakeEvent | FireDetectionEvent | null) => void
  selectedPoi: GeographicPoi | null
  setSelectedPoi: (poi: GeographicPoi | null) => void

  // ─── Live Flight Tracking (OpenSky / FR24 / ADS-B) ──────────────────
  flights: LiveFlight[]
  setFlights: (flights: LiveFlight[]) => void
  selectedFlight: LiveFlight | null
  setSelectedFlight: (flight: LiveFlight | null) => void
  flightsLoading: boolean
  setFlightsLoading: (v: boolean) => void
  flightsError: string | null
  setFlightsError: (err: string | null) => void
  flightsLastUpdated: number | null
  setFlightsLastUpdated: (ts: number | null) => void
  cockpitViewOpen: boolean
  setCockpitViewOpen: (v: boolean) => void
  flightTrailMap: Record<string, Array<[number, number]>>
  updateFlightTrail: (icao24: string, coord: [number, number]) => void
  clearFlights: () => void

  // ─── Flight Controls & Viewport State ────────────────────────────────
  flightTrackingActive: boolean
  setFlightTrackingActive: (v: boolean) => void
  flightMarkersVisible: boolean
  setFlightMarkersVisible: (v: boolean) => void
  flightShowTrails: boolean
  setFlightShowTrails: (v: boolean) => void
  flightAirlineFilter: string
  setFlightAirlineFilter: (v: string) => void
  flightAltitudeFilter: 'all' | 'high' | 'mid' | 'low' | 'ground'
  setFlightAltitudeFilter: (v: 'all' | 'high' | 'mid' | 'low' | 'ground') => void
  flightAircraftTypeFilter: 'all' | 'heavy' | 'medium' | 'turboprop' | 'general'
  setFlightAircraftTypeFilter: (v: 'all' | 'heavy' | 'medium' | 'turboprop' | 'general') => void
  flightSearchQuery: string
  setFlightSearchQuery: (q: string) => void
  flightProviderInfo: {
    provider: string
    fr24Configured: boolean
    attribution: string
    timestamp: number
  } | null
  setFlightProviderInfo: (info: any) => void
  mapBounds: { north: number; south: number; west: number; east: number } | null
  setMapBounds: (bounds: { north: number; south: number; west: number; east: number } | null) => void

  // ─── Visualization Mode ─────────────────────────────────────────────
  visualizationMode: 'markers' | 'clusters' | 'heatmap'
  setVisualizationMode: (mode: 'markers' | 'clusters' | 'heatmap') => void

  // ─── UI State ──────────────────────────────────────────────────────
  inspectorOpen: boolean
  setInspectorOpen: (v: boolean) => void
  layerControlOpen: boolean
  setLayerControlOpen: (v: boolean) => void
  timelineOpen: boolean
  setTimelineOpen: (v: boolean) => void
  searchOpen: boolean
  setSearchOpen: (v: boolean) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: (v: boolean) => void

  // ─── Date / Timeline ───────────────────────────────────────────────
  timelineDate: Date
  setTimelineDate: (date: Date) => void

  // ─── Satellite Imagery ─────────────────────────────────────────────
  activeSatelliteLayer: string | null
  setSatelliteLayer: (layerId: string | null) => void
  satelliteOpacity: number
  setSatelliteOpacity: (opacity: number) => void

  // ─── Provider Health ───────────────────────────────────────────────
  providerHealth: Partial<Record<DataProvider, ProviderHealth>>
  setProviderHealth: (provider: DataProvider, health: Partial<ProviderHealth>) => void

  // ─── Search ────────────────────────────────────────────────────────
  searchResults: SearchResult[]
  setSearchResults: (results: SearchResult[]) => void
  searchQuery: string
  setSearchQuery: (q: string) => void

  // ─── Fly-to ────────────────────────────────────────────────────────
  flyToTarget: GlobeCameraState | null
  flyTo: (target: GlobeCameraState) => void
  clearFlyTo: () => void
}

// Read persisted settings safely in browser
function getPersistedSetting<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const val = localStorage.getItem(key)
    return val ? (JSON.parse(val) as T) : fallback
  } catch {
    return fallback
  }
}

function persistSetting(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export const useEarthOsStore = create<EarthOsState>()(
  subscribeWithSelector((set) => ({
    // Module Navigation
    activeModule: 'explorer',
    setActiveModule: (module) =>
      set((state) => ({
        activeModule: module,
        cockpitViewOpen: module === 'flights' ? state.cockpitViewOpen : false,
        selectedFlight: module === 'flights' ? state.selectedFlight : null,
      })),

    // Globe State
    globeCamera: { center: [0, 20], zoom: 1.5, bearing: 0, pitch: 0 },
    setGlobeCamera: (camera) =>
      set((state) => ({ globeCamera: { ...state.globeCamera, ...camera } })),
    isFullscreen: false,
    setFullscreen: (v) => set({ isFullscreen: v }),
    globeReady: false,
    setGlobeReady: (v) => set({ globeReady: v }),

    // Map Mode (Globe, Satellite, Hybrid, Terrain) — Default is Satellite
    mapMode: getPersistedSetting<MapMode>('eos_map_mode', 'satellite'),
    setMapMode: (mode) => {
      persistSetting('eos_map_mode', mode)
      set({ mapMode: mode })
    },

    // Theme Mode (Dark, Light, System)
    themeMode: getPersistedSetting<ThemeMode>('eos_theme_mode', 'dark'),
    setThemeMode: (theme) => {
      persistSetting('eos_theme_mode', theme)
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        if (theme === 'system') {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          root.setAttribute('data-theme', isDark ? 'dark' : 'light')
        } else {
          root.setAttribute('data-theme', theme)
        }
      }
      set({ themeMode: theme })
    },

    // User Location
    userLocation: null,
    userLocationStatus: 'idle',
    userLocationError: null,
    setUserLocation: (loc) => set({ userLocation: loc, userLocationStatus: loc ? 'located' : 'idle', userLocationError: null }),
    setUserLocationStatus: (status, error = null) => set({ userLocationStatus: status, userLocationError: error }),

    // Layer Visibility
    activeLayers: new Set<LayerId>([
      'earthquakes',
      'eonetEvents',
      'fireHotspots',
      'poi_mountains',
      'poi_water',
      'poi_nature',
      'poi_cities',
      'poi_heritage',
      'poi_space',
      'poi_aviation',
      'countryBorders',
    ]),
    toggleLayer: (layer) =>
      set((state) => {
        const next = new Set(state.activeLayers)
        if (next.has(layer)) next.delete(layer)
        else next.add(layer)
        return { activeLayers: next }
      }),
    setLayerVisible: (layer, visible) =>
      set((state) => {
        const next = new Set(state.activeLayers)
        if (visible) next.add(layer)
        else next.delete(layer)
        return { activeLayers: next }
      }),

    // Event Data
    earthquakes: [],
    setEarthquakes: (events) => set({ earthquakes: events }),
    eonetEvents: [],
    setEonetEvents: (events) => set({ eonetEvents: events }),
    fireHotspots: [],
    setFireHotspots: (hotspots) => set({ fireHotspots: hotspots }),

    // Visualization Mode
    visualizationMode: 'markers',
    setVisualizationMode: (mode) => set({ visualizationMode: mode }),

    // Filtering
    eventTimeRange: 'day',
    setEventTimeRange: (range) => set({ eventTimeRange: range }),
    minMagnitude: 0,
    setMinMagnitude: (mag) => set({ minMagnitude: mag }),
    activeCategories: new Set(['earthquakes', 'wildfires', 'volcanoes', 'severeStorms']),
    toggleCategory: (category) =>
      set((state) => {
        const next = new Set(state.activeCategories)
        if (next.has(category)) next.delete(category)
        else next.add(category)
        return { activeCategories: next }
      }),

    // Event & POI Selection
    selectedEvent: null,
    setSelectedEvent: (event) =>
      set({ selectedEvent: event, selectedPoi: null, selectedFlight: null, inspectorOpen: event !== null }),
    selectedPoi: null,
    setSelectedPoi: (poi) =>
      set({ selectedPoi: poi, selectedEvent: null, selectedFlight: null, inspectorOpen: poi !== null }),

    // Live Flight Tracking
    flights: [],
    setFlights: (newFlights) =>
      set((state) => {
        const existingMap = new Map(state.flights.map(f => [f.icao24, f]))
        const merged = newFlights.map(f => {
          const existing = existingMap.get(f.icao24)
          if (existing) {
            if (existing.latitude !== f.latitude || existing.longitude !== f.longitude) {
              f.previousPosition = {
                latitude: existing.latitude,
                longitude: existing.longitude,
                heading: existing.heading,
                timestamp: existing.lastPositionUpdate || existing.lastContact,
              }
            } else if (existing.previousPosition) {
              f.previousPosition = existing.previousPosition
            }
            if (existing.photo && !f.photo) {
              f.photo = existing.photo
            }
            if (existing.originAirportDetails && !f.originAirportDetails) {
              f.originAirportDetails = existing.originAirportDetails
              f.destinationAirportDetails = existing.destinationAirportDetails
              f.timings = existing.timings
            }
          }
          return f
        })
        return { flights: merged }
      }),
    selectedFlight: null,
    setSelectedFlight: (flight) =>
      set({ selectedFlight: flight, selectedEvent: null, selectedPoi: null, inspectorOpen: flight !== null }),
    flightsLoading: false,
    setFlightsLoading: (v) => set({ flightsLoading: v }),
    flightsError: null,
    setFlightsError: (err) => set({ flightsError: err }),
    flightsLastUpdated: null,
    setFlightsLastUpdated: (ts) => set({ flightsLastUpdated: ts }),
    cockpitViewOpen: false,
    setCockpitViewOpen: (v) => set({ cockpitViewOpen: v }),
    flightTrailMap: {},
    updateFlightTrail: (icao24, coord) =>
      set((state) => {
        const existing = state.flightTrailMap[icao24] || []
        const last = existing[existing.length - 1]
        if (last && last[0] === coord[0] && last[1] === coord[1]) return state
        const updated = [...existing.slice(-40), coord]
        return {
          flightTrailMap: {
            ...state.flightTrailMap,
            [icao24]: updated,
          },
        }
      }),
    clearFlights: () =>
      set({
        flights: [],
        selectedFlight: null,
        flightsLoading: false,
        flightsError: null,
        cockpitViewOpen: false,
        flightTrailMap: {},
      }),

    // Flight Controls & Viewport State
    flightTrackingActive: true,
    setFlightTrackingActive: (v) => set({ flightTrackingActive: v }),
    flightMarkersVisible: true,
    setFlightMarkersVisible: (v) => set({ flightMarkersVisible: v }),
    flightShowTrails: true,
    setFlightShowTrails: (v) => set({ flightShowTrails: v }),
    flightAirlineFilter: 'all',
    setFlightAirlineFilter: (v) => set({ flightAirlineFilter: v }),
    flightAltitudeFilter: 'all',
    setFlightAltitudeFilter: (v) => set({ flightAltitudeFilter: v }),
    flightAircraftTypeFilter: 'all',
    setFlightAircraftTypeFilter: (v) => set({ flightAircraftTypeFilter: v }),
    flightSearchQuery: '',
    setFlightSearchQuery: (q) => set({ flightSearchQuery: q }),
    flightProviderInfo: null,
    setFlightProviderInfo: (info) => set({ flightProviderInfo: info }),
    mapBounds: null,
    setMapBounds: (bounds) => set({ mapBounds: bounds }),

    // UI State
    inspectorOpen: false,
    setInspectorOpen: (v) => set({ inspectorOpen: v }),
    layerControlOpen: false,
    setLayerControlOpen: (v) => set({ layerControlOpen: v }),
    timelineOpen: false,
    setTimelineOpen: (v) => set({ timelineOpen: v }),
    searchOpen: false,
    setSearchOpen: (v) => set({ searchOpen: v }),
    sidebarCollapsed: false,
    setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

    // Date / Timeline
    timelineDate: new Date(),
    setTimelineDate: (date) => set({ timelineDate: date }),

    // Satellite Imagery
    activeSatelliteLayer: null,
    setSatelliteLayer: (layerId) => set({ activeSatelliteLayer: layerId }),
    satelliteOpacity: 0.8,
    setSatelliteOpacity: (opacity) => set({ satelliteOpacity: opacity }),

    // Provider Health
    providerHealth: {},
    setProviderHealth: (provider, health) =>
      set((state) => ({
        providerHealth: {
          ...state.providerHealth,
          [provider]: { ...state.providerHealth[provider], ...health },
        },
      })),

    // Search
    searchResults: [],
    setSearchResults: (results) => set({ searchResults: results }),
    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),

    // Fly-to
    flyToTarget: null,
    flyTo: (target) => set({ flyToTarget: target }),
    clearFlyTo: () => set({ flyToTarget: null }),
  }))
)
