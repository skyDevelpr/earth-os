// Core unified event model for EARTH OS
// All provider data is normalized to these types

export type EventCategory =
  | 'earthquakes'
  | 'wildfires'
  | 'volcanoes'
  | 'severeStorms'
  | 'floods'
  | 'drought'
  | 'snow'
  | 'seaIce'
  | 'dustHaze'
  | 'manmade'
  | 'temperatureExtremes'
  | 'waterColor'
  | 'fireHotspot'
  | 'spaceWeather'
  | 'other'

export type EventSeverity = 'low' | 'moderate' | 'high' | 'extreme' | 'unknown'
export type EventStatus = 'open' | 'closed' | 'unknown'
export type DataProvider = 'usgs' | 'eonet' | 'firms' | 'gibs' | 'openaq' | 'openmeteo' | 'donki' | 'worldbank' | 'opensky'
export type DataFreshness = 'live' | 'recent' | 'cached' | 'historical' | 'stale'

export interface GeoCoordinate {
  longitude: number
  latitude: number
  altitude?: number // km
}

export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number] | [number, number, number]
}

export interface GeoPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export type EventGeometry = GeoPoint | GeoPolygon

export interface UnifiedEvent {
  id: string
  provider: DataProvider
  providerId: string
  category: EventCategory
  title: string
  description?: string
  geometry: EventGeometry
  coordinates: GeoCoordinate
  measurement?: number
  measurementUnit?: string
  observationTime: string   // ISO 8601
  publicationTime?: string  // ISO 8601
  lastUpdated?: string      // ISO 8601
  fetchedAt: string         // ISO 8601
  sourceUrl?: string
  confidence?: number       // 0-1
  severity: EventSeverity
  status: EventStatus
  freshness: DataFreshness
  // Provider-specific extras preserved
  providerData?: Record<string, unknown>
}

// Earthquake-specific fields
export interface EarthquakeEvent extends UnifiedEvent {
  category: 'earthquakes'
  magnitude: number
  magnitudeType: string   // Mw, mb, ml, etc.
  depth: number           // km
  depthError?: number
  horizontalError?: number
  locationSource?: string
  felt?: number           // Reports
  cdi?: number            // Community Internet Intensity
  mmi?: number            // Modified Mercalli Intensity
  alert?: 'green' | 'yellow' | 'orange' | 'red'
  tsunami?: boolean
  sig?: number            // USGS significance score
  nst?: number            // Number of seismic stations
  dmin?: number           // Min station distance (degrees)
  rms?: number            // RMS travel time residual
  gap?: number            // Azimuthal gap (degrees)
  magSource?: string
  net?: string            // Contributing network
  usgsUrl?: string
}

// Fire hotspot detection-specific fields
export interface FireDetectionEvent extends UnifiedEvent {
  category: 'fireHotspot'
  sensor: 'VIIRS_SNPP' | 'VIIRS_NOAA20' | 'MODIS' | string
  satellite: string
  acquisitionDate: string
  acquisitionTime: string    // HHMM UTC
  fireRadiativePower?: number // MW
  brightnessTemp?: number    // Kelvin
  confidenceLevel: 'low' | 'nominal' | 'high' | number
  // CRITICAL: These are thermal anomaly DETECTIONS, not confirmed fires
  detectionType: 'thermal_anomaly'
}

// Air quality station reading
export interface AirQualityReading {
  stationId: string
  stationName: string
  coordinates: GeoCoordinate
  parameter: 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3' | 'bc'
  value: number
  unit: string
  measurementTime: string
  sourceProvider: string
  country?: string
  city?: string
  fetchedAt: string
  freshness: DataFreshness
}

// Weather data point
export interface WeatherData {
  coordinates: GeoCoordinate
  time: string
  temperature2m?: number      // °C
  humidity?: number           // %
  windSpeed10m?: number       // km/h
  windDirection10m?: number   // degrees
  precipitation?: number      // mm
  cloudCover?: number         // %
  surfacePressure?: number    // hPa
  weatherCode?: number        // WMO code
  dataSource: 'forecast' | 'historical'
  model?: string
  fetchedAt: string
}

// GIBS imagery layer descriptor
export interface GibsLayer {
  id: string
  title: string
  description?: string
  format: 'JPEG' | 'PNG'
  tileMatrixSet: string
  hasTime: boolean
  startDate?: string
  endDate?: string        // null = current
  period?: string         // P1D = daily
  resolution?: string     // 250m, 500m, 1km, 2km
  projection: 'epsg4326' | 'epsg3857'
  category: 'trueColor' | 'landSurface' | 'ocean' | 'atmosphere' | 'vegetation' | 'reference'
}

// Module identifiers
export type ModuleId =
  | 'explorer'
  | 'events'
  | 'flights'
  | 'news'
  | 'satellite'
  | 'atmosphere'
  | 'history'
  | 'analytics'
  | 'intelligence'

// Permanent Geographic POI Category
export type PoiCategory =
  | 'mountain'
  | 'volcano'
  | 'lake'
  | 'river'
  | 'waterfall'
  | 'park'
  | 'desert'
  | 'glacier'
  | 'reef'
  | 'ocean'
  | 'capital'
  | 'megacity'
  | 'airport'
  | 'seaport'
  | 'spaceport'
  | 'dam'
  | 'power_station'
  | 'observatory'
  | 'research_station'
  | 'unesco'
  | 'landmark'

export type PoiGroup = 'geography' | 'infrastructure' | 'places'

export interface GeographicPoi {
  id: string
  name: string
  category: PoiCategory
  group: PoiGroup
  coordinates: GeoCoordinate
  country: string
  minZoom: number
  importance: number // 1 to 10
  description: string
  metadata?: {
    elevation?: number       // meters
    population?: number
    length?: number          // km (rivers)
    area?: number            // sq km (lakes, deserts, parks)
    capacity?: string        // MW or TEU or m3
    iataCode?: string        // airports
    runways?: number
    yearEstablished?: number
    unescoYear?: number
    status?: string
    operator?: string
    sourceUrl?: string
    imageUrl?: string
  }
}

// Layer identifiers
export type LayerId =
  | 'earthquakes'
  | 'fireHotspots'
  | 'eonetEvents'
  | 'earthquakeHeatmap'
  | 'fireHeatmap'
  | 'poi_mountains'
  | 'poi_water'
  | 'poi_nature'
  | 'poi_aviation'
  | 'poi_maritime'
  | 'poi_space'
  | 'poi_energy'
  | 'poi_science'
  | 'poi_cities'
  | 'poi_heritage'
  | 'airQuality'
  | 'satellite_trueColor'
  | 'satellite_vegetation'
  | 'satellite_temperature'
  | 'countryBorders'
  | 'dayNight'

// Provider health status
export interface ProviderHealth {
  provider: DataProvider
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  lastSuccessful?: string
  lastError?: string
  errorCount: number
  responseTimeMs?: number
}

// API response wrapper
export interface ApiResponse<T> {
  data: T
  fetchedAt: string
  freshness: DataFreshness
  provider: DataProvider
  cacheAge?: number          // seconds
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  provider?: DataProvider
  retryAfter?: number        // seconds
}

// Globe camera state
export interface GlobeCameraState {
  center: [number, number]   // [lng, lat]
  zoom: number
  bearing: number
  pitch: number
}

// Search result
export interface SearchResult {
  id: string
  type: 'location' | 'event' | 'country' | 'poi'
  title: string
  subtitle?: string
  coordinates: GeoCoordinate
  eventRef?: string
  countryCode?: string
  poiCategory?: PoiCategory
}

// ─── Live Flight Tracking Types (Flightradar24 / OpenSky ADS-B) ──────────────
export interface AirportDetails {
  name: string
  iata: string
  icao: string
  city: string
  country: string
  latitude: number
  longitude: number
  timezone?: string
}

export interface FlightTimings {
  scheduledDeparture: string | null
  actualDeparture: string | null
  estimatedDeparture: string | null
  scheduledArrival: string | null
  estimatedArrival: string | null
  actualArrival: string | null
  departureTimezone?: string
  arrivalTimezone?: string
}

export interface FlightPhoto {
  url: string
  photographer: string
  link: string
  source: string
  aircraftModel?: string
}

export interface LiveFlight {
  icao24: string
  callsign: string
  flightNumber: string
  airline: string
  airlineCode?: string
  aircraftType?: string
  registration?: string
  originCountry: string
  originAirport?: string
  destinationAirport?: string
  originAirportDetails?: AirportDetails
  destinationAirportDetails?: AirportDetails
  timings?: FlightTimings
  photo?: FlightPhoto
  longitude: number
  latitude: number
  altitudeBaroMeters: number | null
  altitudeFeet: number | null
  groundSpeedKnots: number | null
  groundSpeedKmh: number | null
  heading: number | null // degrees clockwise from North (0-360)
  verticalRateFpm: number | null // ft/min
  verticalRateMs: number | null // m/s
  onGround: boolean
  squawk?: string | null
  lastPositionUpdate: number // unix epoch in seconds
  lastContact: number
  positionSource: string // 'ADS-B' | 'ASTERIX' | 'MLAT' | 'FLARM'
  trail?: Array<[number, number]> // [lng, lat]
  previousPosition?: {
    latitude: number
    longitude: number
    heading: number | null
    timestamp: number
  }
  isStale?: boolean
}

export interface FlightsApiResponse {
  success: boolean
  timestamp: number
  provider: string
  fr24Configured: boolean
  attribution: string
  dataFreshness: 'live' | 'recent' | 'cached' | 'stale'
  totalActive: number
  flights: LiveFlight[]
  setupGuide?: string
  error?: string
}

